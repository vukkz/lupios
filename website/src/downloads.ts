// Where the installer ISOs live. They're too big for GitHub (2 GB per file), so they go to
// SourceForge, which mirrors them worldwide for free.
export const downloads = {
  // false until the SourceForge project has the files: the site says "coming soon" instead of
  // showing download buttons that lead nowhere
  ready: true,
  base: "https://sourceforge.net/projects/lupios/files",
};

export const isos = [
  { file: "lupios.iso", name: "LupiOS", for: "AMD or Intel graphics, older NVIDIA cards (GTX 10xx and before), and virtual machines", size: "4.6 GB" },
  { file: "lupios-nvidia.iso", name: "LupiOS for NVIDIA", for: "NVIDIA GeForce GTX 16xx, RTX 20xx and newer", size: "5.5 GB" },
];

export const fileUrl = (file: string) => `${downloads.base}/${file}/download`;
