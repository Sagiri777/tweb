const IS_INSTALL_PROMPT_SUPPORTED = typeof window !== 'undefined' && 'onbeforeinstallprompt' in window;
export default IS_INSTALL_PROMPT_SUPPORTED;
