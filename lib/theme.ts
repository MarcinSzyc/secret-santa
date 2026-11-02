export const THEME_KEY = "theme";

/** Runs before first paint (inlined in <head>) so a saved theme never flashes the wrong colors. */
export const themeBootScript = `try{var t=localStorage.getItem("${THEME_KEY}");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`;
