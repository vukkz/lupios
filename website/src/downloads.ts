// Where the installer ISOs live. They're too big for GitHub (2 GB per file), so they go to
// SourceForge, which mirrors them worldwide for free.
export const downloads = {
  // false until the SourceForge project has the files: the site says "coming soon" instead of
  // showing download buttons that lead nowhere
  ready: true,
  base: "https://sourceforge.net/projects/lupios/files",
};

export const isos = [
  { file: "lupios.iso", name: "LupiOS", for: "AMD or Intel graphics, older NVIDIA cards (GTX 10xx and before), and virtual machines", size: "4.5 GB" },
  { file: "lupios-nvidia.iso", name: "LupiOS for NVIDIA", for: "NVIDIA GeForce GTX 16xx, RTX 20xx and newer", size: "5.4 GB" },
  // installer only: picks lupios or lupios-nvidia during setup and downloads it (iso/anaconda/online)
  { file: "lupios-online.iso", name: "LupiOS Online", for: "Any PC, smaller download: needs internet while installing", size: "1.2 GB" },
];

export const fileUrl = (file: string) => `${downloads.base}/${file}/download`;

// The order the download page's key leads to them (couplet 1, then 2); the home page lists them the same way
export const keyOrder = ["lupios-online.iso", "lupios-nvidia.iso", "lupios.iso"];

// Each ISO's place in the key: lupios.iso -> #iso-lupios, lupios-nvidia.iso -> #iso-nvidia
export const isoId = (file: string) => `iso-${file.replace(/^lupios-?|\.iso$/g, "") || "lupios"}`;
