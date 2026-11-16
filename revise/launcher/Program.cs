// Révise — lanceur Windows : un seul .exe qui embarque l'application web et l'affiche dans une fenêtre WebView2.
using System;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.IO.Compression;
using System.Reflection;
using System.Runtime.CompilerServices;
using System.Windows.Forms;
using Microsoft.Web.WebView2.Core;
using Microsoft.Web.WebView2.WinForms;

static class Program
{
    public static string Root, BinDir, AppDir;

    [STAThread]
    static void Main()
    {
        Application.EnableVisualStyles();
        Application.SetCompatibleTextRenderingDefault(false);
        try
        {
            Root = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "Revise");
            string build = ReadText("build.txt").Trim();
            BinDir = Path.Combine(Root, "bin-" + build);
            AppDir = Path.Combine(Root, "app-" + build);
            Extract(build);
            AppDomain.CurrentDomain.AssemblyResolve += delegate(object s, ResolveEventArgs e)
            {
                string p = Path.Combine(BinDir, new AssemblyName(e.Name).Name + ".dll");
                return File.Exists(p) ? Assembly.LoadFrom(p) : null;
            };
            Run();
        }
        catch (Exception ex) { Fallback(ex); }
    }

    [MethodImpl(MethodImplOptions.NoInlining)]
    static void Run() { Application.Run(new MainForm()); }

    static Stream Res(string name) { return Assembly.GetExecutingAssembly().GetManifestResourceStream(name); }
    static string ReadText(string name) { using (StreamReader r = new StreamReader(Res(name))) return r.ReadToEnd(); }

    // Décompresse l'application et les DLL dans %LOCALAPPDATA%\Revise (une seule fois par version)
    static void Extract(string build)
    {
        Directory.CreateDirectory(Root);
        string ok = Path.Combine(AppDir, ".ok");
        if (!File.Exists(ok))
        {
            if (Directory.Exists(AppDir)) Directory.Delete(AppDir, true);
            Directory.CreateDirectory(AppDir);
            using (ZipArchive zip = new ZipArchive(Res("app.zip"), ZipArchiveMode.Read))
                foreach (ZipArchiveEntry en in zip.Entries)
                {
                    string dest = Path.GetFullPath(Path.Combine(AppDir, en.FullName));
                    if (!dest.StartsWith(AppDir, StringComparison.OrdinalIgnoreCase)) continue;
                    if (en.FullName.EndsWith("/")) { Directory.CreateDirectory(dest); continue; }
                    Directory.CreateDirectory(Path.GetDirectoryName(dest));
                    using (Stream i = en.Open()) using (FileStream o = File.Create(dest)) i.CopyTo(o);
                }
            Directory.CreateDirectory(BinDir);
            foreach (string n in new string[] { "Microsoft.Web.WebView2.Core.dll", "Microsoft.Web.WebView2.WinForms.dll", "WebView2Loader.dll" })
                using (Stream i = Res(n)) using (FileStream o = File.Create(Path.Combine(BinDir, n))) i.CopyTo(o);
            File.WriteAllText(ok, build);
            // nettoyage des anciennes versions (la progression, stockée dans le dossier WebView2, est conservée)
            foreach (string d in Directory.GetDirectories(Root))
            {
                string n = Path.GetFileName(d);
                if ((n.StartsWith("app-") || n.StartsWith("bin-")) && !n.EndsWith(build))
                    try { Directory.Delete(d, true); } catch { }
            }
        }
    }

    // Si WebView2 n'est pas disponible : ouvrir l'application dans le navigateur par défaut
    public static void Fallback(Exception ex)
    {
        string index = AppDir == null ? null : Path.Combine(AppDir, "index.html");
        if (index != null && File.Exists(index))
        {
            MessageBox.Show("La fenêtre intégrée (Microsoft Edge WebView2) n'a pas pu démarrer.\nL'application va s'ouvrir dans ton navigateur à la place.\n\nDétail : " + ex.Message, "Révise", MessageBoxButtons.OK, MessageBoxIcon.Information);
            try { Process.Start(index); } catch { }
        }
        else MessageBox.Show("Impossible de démarrer Révise.\n\n" + ex, "Révise", MessageBoxButtons.OK, MessageBoxIcon.Error);
    }
}

class MainForm : Form
{
    WebView2 wv;

    public MainForm()
    {
        Text = "Révise";
        BackColor = Color.FromArgb(0x17, 0x1a, 0x2b);
        StartPosition = FormStartPosition.CenterScreen;
        Rectangle wa = Screen.PrimaryScreen.WorkingArea;
        Size = new Size(Math.Min(1400, wa.Width - 40), Math.Min(920, wa.Height - 40));
        MinimumSize = new Size(760, 540);
        try { Icon = Icon.ExtractAssociatedIcon(Application.ExecutablePath); } catch { }
        wv = new WebView2();
        wv.Dock = DockStyle.Fill;
        wv.DefaultBackgroundColor = Color.FromArgb(0x17, 0x1a, 0x2b);
        Controls.Add(wv);
        Load += OnLoad;
    }

    async void OnLoad(object sender, EventArgs e)
    {
        try
        {
            CoreWebView2Environment.SetLoaderDllFolderPath(Program.BinDir);
            CoreWebView2Environment env = await CoreWebView2Environment.CreateAsync(null, Path.Combine(Program.Root, "WebView2"), null);
            await wv.EnsureCoreWebView2Async(env);
            CoreWebView2Settings st = wv.CoreWebView2.Settings;
            st.AreDevToolsEnabled = false;
            st.AreDefaultContextMenusEnabled = false;
            st.IsStatusBarEnabled = false;
            wv.CoreWebView2.SetVirtualHostNameToFolderMapping("revise.example", Program.AppDir, CoreWebView2HostResourceAccessKind.Allow);
            wv.CoreWebView2.NewWindowRequested += delegate(object o, CoreWebView2NewWindowRequestedEventArgs a) { a.Handled = true; };
            wv.CoreWebView2.Navigate("https://revise.example/index.html");
        }
        catch (Exception ex)
        {
            Program.Fallback(ex);
            Close();
        }
    }
}
