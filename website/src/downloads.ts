// Where the installer ISOs live. They're too big for GitHub (2 GB per file), so they go to
// SourceForge, which mirrors them worldwide for free.
export const downloads = {
  // false until the SourceForge project has the files: the site says "coming soon" instead of
  // showing download buttons that lead nowhere
  ready: false,
  base: "https://sourceforge.net/projects/lupios/files",
};

export const isos = [
  { file: "lupios.iso", name: "LupiOS", for: "AMD or Intel graphics, and virtual machines", size: "6 GB" },
  { file: "lupios-nvidia.iso", name: "LupiOS for NVIDIA", for: "NVIDIA graphics: GeForce, RTX, GTX", size: "7 GB" },
];

export const fileUrl = (file: string) => `${downloads.base}/${file}/download`;
