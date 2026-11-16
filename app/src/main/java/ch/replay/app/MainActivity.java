package ch.replay.app;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.ContentUris;
import android.content.ContentValues;
import android.content.Intent;
import android.database.Cursor;
import android.net.Uri;
import android.os.Bundle;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Base64;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import androidx.core.content.FileProvider;
import androidx.webkit.WebViewAssetLoader;

import java.io.File;
import java.io.IOException;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;

public class MainActivity extends Activity {

    private static final String START_URL = "https://appassets.androidplatform.net/assets/www/index.html";
    private static final int REQ_FILE = 42;

    private WebView web;
    private ValueCallback<Uri[]> fileCallback;
    private Uri cameraUri;
    private OutputStream pendingOut;
    private Uri pendingUri;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        web = new WebView(this);
        setContentView(web);

        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(true);
        s.setMediaPlaybackRequiresUserGesture(false);

        final WebViewAssetLoader loader = new WebViewAssetLoader.Builder()
                .addPathHandler("/assets/", new WebViewAssetLoader.AssetsPathHandler(this))
                .build();

        web.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                return loader.shouldInterceptRequest(request.getUrl());
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri u = request.getUrl();
                if ("appassets.androidplatform.net".equals(u.getHost())) return false;
                try {
                    startActivity(new Intent(Intent.ACTION_VIEW, u));
                } catch (ActivityNotFoundException ignored) { }
                return true;
            }
        });

        web.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback, FileChooserParams params) {
                if (fileCallback != null) fileCallback.onReceiveValue(null);
                fileCallback = callback;
                cameraUri = null;

                Intent pick = params.createIntent();
                Intent toLaunch;

                if (acceptsImages(params.getAcceptTypes())) {
                    Intent camera = cameraIntent();
                    if (params.isCaptureEnabled() && camera != null) {
                        toLaunch = camera;
                    } else {
                        toLaunch = Intent.createChooser(pick, "Choisir une image");
                        if (camera != null) toLaunch.putExtra(Intent.EXTRA_INITIAL_INTENTS, new Intent[]{camera});
                    }
                } else {
                    toLaunch = Intent.createChooser(pick, "Choisir un fichier");
                }

                try {
                    startActivityForResult(toLaunch, REQ_FILE);
                } catch (ActivityNotFoundException e) {
                    fileCallback.onReceiveValue(null);
                    fileCallback = null;
                    return false;
                }
                return true;
            }
        });

        web.addJavascriptInterface(new Bridge(), "AndroidBridge");

        if (savedInstanceState != null) {
            web.restoreState(savedInstanceState);
        } else {
            web.loadUrl(START_URL);
        }
    }

    private static boolean acceptsImages(String[] types) {
        if (types == null || types.length == 0) return false;
        for (String t : types) {
            if (t != null && t.startsWith("image")) return true;
        }
        return false;
    }

    private Intent cameraIntent() {
        try {
            File dir = new File(getCacheDir(), "camera");
            if (!dir.exists() && !dir.mkdirs()) return null;
            File photo = File.createTempFile("photo_", ".jpg", dir);
            cameraUri = FileProvider.getUriForFile(this, getPackageName() + ".files", photo);
            Intent cam = new Intent(MediaStore.ACTION_IMAGE_CAPTURE);
            cam.putExtra(MediaStore.EXTRA_OUTPUT, cameraUri);
            cam.addFlags(Intent.FLAG_GRANT_WRITE_URI_PERMISSION | Intent.FLAG_GRANT_READ_URI_PERMISSION);
            return cam;
        } catch (IOException | IllegalArgumentException e) {
            cameraUri = null;
            return null;
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode != REQ_FILE || fileCallback == null) return;

        Uri[] result = null;
        if (resultCode == RESULT_OK) {
            boolean hasPicked = data != null && (data.getData() != null || data.getClipData() != null);
            if (hasPicked) {
                result = WebChromeClient.FileChooserParams.parseResult(resultCode, data);
            } else if (cameraUri != null) {
                result = new Uri[]{cameraUri};
            }
        }
        fileCallback.onReceiveValue(result);
        fileCallback = null;
    }

    @Override
    @SuppressWarnings("deprecation")
    public void onBackPressed() {
        web.evaluateJavascript("(window.__back && window.__back()) || false", value -> {
            if (!"true".equals(value)) MainActivity.super.onBackPressed();
        });
    }

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        super.onSaveInstanceState(outState);
        web.saveState(outState);
    }

    /** Lets the page save files (backups, PDF exports) into Downloads. */
    public class Bridge {
        @JavascriptInterface
        public synchronized boolean beginFile(String name, String mime) {
            return begin(null, name, mime);
        }

        /** Same as beginFile, inside Downloads/<folder> (used for automatic backups). */
        @JavascriptInterface
        public synchronized boolean beginFileIn(String folder, String name, String mime) {
            return begin(folder, name, mime);
        }

        private boolean begin(String folder, String name, String mime) {
            try {
                discardPending();
                ContentValues cv = new ContentValues();
                cv.put(MediaStore.Downloads.DISPLAY_NAME, name);
                cv.put(MediaStore.Downloads.MIME_TYPE, mime);
                cv.put(MediaStore.Downloads.IS_PENDING, 1);
                if (folder != null && !folder.isEmpty()) {
                    cv.put(MediaStore.Downloads.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS + "/" + folder);
                }
                pendingUri = getContentResolver().insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, cv);
                if (pendingUri == null) return false;
                pendingOut = getContentResolver().openOutputStream(pendingUri);
                if (pendingOut == null) { discardPending(); return false; }
                return true;
            } catch (Exception e) {
                discardPending();
                return false;
            }
        }

        /** Closes and deletes a file that was begun but not finished, so no truncated file is left behind. */
        private void discardPending() {
            if (pendingOut != null) { try { pendingOut.close(); } catch (Exception ignored) { } pendingOut = null; }
            if (pendingUri != null) { try { getContentResolver().delete(pendingUri, null, null); } catch (Exception ignored) { } pendingUri = null; }
        }

        @JavascriptInterface
        public synchronized void abortFile() {
            discardPending();
        }

        /** Keeps the newest files named prefix* in Downloads/<folder> and deletes the older ones. Returns how many were deleted. */
        @JavascriptInterface
        public synchronized int pruneFiles(String folder, String prefix, int keep) {
            int removed = 0;
            try {
                String[] proj = { MediaStore.Downloads._ID };
                String sel = MediaStore.Downloads.RELATIVE_PATH + " LIKE ? AND " + MediaStore.Downloads.DISPLAY_NAME + " LIKE ?";
                String[] args = { Environment.DIRECTORY_DOWNLOADS + "/" + folder + "%", prefix + "%" };
                try (Cursor c = getContentResolver().query(MediaStore.Downloads.EXTERNAL_CONTENT_URI, proj, sel, args,
                        MediaStore.Downloads.DATE_ADDED + " DESC, " + MediaStore.Downloads._ID + " DESC")) {
                    if (c == null) return 0;
                    int n = 0;
                    while (c.moveToNext()) {
                        if (n++ < keep) continue;
                        Uri u = ContentUris.withAppendedId(MediaStore.Downloads.EXTERNAL_CONTENT_URI, c.getLong(0));
                        removed += getContentResolver().delete(u, null, null);
                    }
                }
            } catch (Exception ignored) { }
            return removed;
        }

        @JavascriptInterface
        public synchronized boolean appendBase64(String chunk) {
            if (pendingOut == null) return false;
            try {
                pendingOut.write(Base64.decode(chunk, Base64.DEFAULT));
                return true;
            } catch (Exception e) {
                return false;
            }
        }

        @JavascriptInterface
        public synchronized boolean endFile() {
            if (pendingOut == null || pendingUri == null) return false;
            try {
                pendingOut.close();
                pendingOut = null;
                ContentValues cv = new ContentValues();
                cv.put(MediaStore.Downloads.IS_PENDING, 0);
                getContentResolver().update(pendingUri, cv, null, null);
                pendingUri = null;
                return true;
            } catch (Exception e) {
                discardPending();
                return false;
            }
        }

        @JavascriptInterface
        public boolean saveFile(String name, String content) {
            try {
                ContentValues cv = new ContentValues();
                cv.put(MediaStore.Downloads.DISPLAY_NAME, name);
                cv.put(MediaStore.Downloads.MIME_TYPE, "application/json");
                cv.put(MediaStore.Downloads.IS_PENDING, 1);
                Uri uri = getContentResolver().insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, cv);
                if (uri == null) return false;
                try (OutputStream os = getContentResolver().openOutputStream(uri)) {
                    if (os == null) return false;
                    os.write(content.getBytes(StandardCharsets.UTF_8));
                }
                cv.clear();
                cv.put(MediaStore.Downloads.IS_PENDING, 0);
                getContentResolver().update(uri, cv, null, null);
                return true;
            } catch (Exception e) {
                return false;
            }
        }
    }
}
