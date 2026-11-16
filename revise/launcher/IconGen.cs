// Génère icon.ico (dégradé violet-bleu + lettre R) — utilisé une fois pendant la compilation
using System;
using System.Collections.Generic;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;
using System.Drawing.Text;
using System.IO;

static class IconGen
{
    static Bitmap Draw(int s)
    {
        Bitmap b = new Bitmap(s, s, PixelFormat.Format32bppArgb);
        using (Graphics g = Graphics.FromImage(b))
        {
            g.SmoothingMode = SmoothingMode.AntiAlias; g.TextRenderingHint = TextRenderingHint.AntiAlias; g.Clear(Color.Transparent);
            float r = s * 0.22f, m = s * 0.03f, w = s - 2 * m;
            using (GraphicsPath p = new GraphicsPath())
            {
                p.AddArc(m, m, 2 * r, 2 * r, 180, 90); p.AddArc(m + w - 2 * r, m, 2 * r, 2 * r, 270, 90);
                p.AddArc(m + w - 2 * r, m + w - 2 * r, 2 * r, 2 * r, 0, 90); p.AddArc(m, m + w - 2 * r, 2 * r, 2 * r, 90, 90); p.CloseFigure();
                using (LinearGradientBrush br = new LinearGradientBrush(new RectangleF(0, 0, s, s), Color.FromArgb(0x7c, 0x5c, 0xff), Color.FromArgb(0x2f, 0x7d, 0xe0), 45f)) g.FillPath(br, p);
            }
            using (Font f = new Font("Segoe UI", s * 0.56f, FontStyle.Bold, GraphicsUnit.Pixel))
            using (StringFormat sf = new StringFormat())
            {
                sf.Alignment = StringAlignment.Center; sf.LineAlignment = StringAlignment.Center;
                g.DrawString("R", f, Brushes.White, new RectangleF(0, s * 0.02f, s, s), sf);
            }
        }
        return b;
    }

    static byte[] Dib(Bitmap b)
    {
        int s = b.Width; MemoryStream ms = new MemoryStream(); BinaryWriter w = new BinaryWriter(ms);
        w.Write(40); w.Write(s); w.Write(s * 2); w.Write((short)1); w.Write((short)32); w.Write(0); w.Write(0); w.Write(0); w.Write(0); w.Write(0); w.Write(0);
        for (int y = s - 1; y >= 0; y--) for (int x = 0; x < s; x++) { Color c = b.GetPixel(x, y); w.Write(c.B); w.Write(c.G); w.Write(c.R); w.Write(c.A); }
        int row = ((s + 31) / 32) * 4; w.Write(new byte[row * s]);
        return ms.ToArray();
    }

    static void Main(string[] args)
    {
        int[] sizes = { 16, 24, 32, 48, 64, 256 };
        List<byte[]> imgs = new List<byte[]>();
        foreach (int s in sizes)
            using (Bitmap b = Draw(s))
            {
                if (s == 256) { MemoryStream ms = new MemoryStream(); b.Save(ms, ImageFormat.Png); imgs.Add(ms.ToArray()); }
                else imgs.Add(Dib(b));
            }
        using (BinaryWriter w = new BinaryWriter(File.Create(args[0])))
        {
            w.Write((short)0); w.Write((short)1); w.Write((short)sizes.Length);
            int off = 6 + 16 * sizes.Length;
            for (int i = 0; i < sizes.Length; i++)
            {
                w.Write((byte)(sizes[i] == 256 ? 0 : sizes[i])); w.Write((byte)(sizes[i] == 256 ? 0 : sizes[i])); w.Write((byte)0); w.Write((byte)0);
                w.Write((short)1); w.Write((short)32); w.Write(imgs[i].Length); w.Write(off); off += imgs[i].Length;
            }
            foreach (byte[] d in imgs) w.Write(d);
        }
    }
}
