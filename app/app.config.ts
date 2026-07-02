export default defineAppConfig({
  ui: {
    colors: {
      primary: "primary",
      secondary: "secondary",
      warning: "warning",
      success: "success",
      error: "error",
      neutral: "neutral",
    },

    // Default page title (overridden per-page via useHead)
    defaults: {
      title: 'ArsipKu',
    },

    typography: {
      base: "font-montserrat ",

      variants: {
        //normal
        heading1: "text-[60px] font-normal dark:text-white",
        heading2: "text-[52px] font-normal dark:text-white",
        heading3: "text-[42px] font-normal dark:text-white",
        heading4: "text-[38px] font-normal dark:text-white",
        heading5: "text-[32px] font-normal dark:text-white",
        heading6: "text-[26px] font-normal dark:text-white",
        heading7: "text-[24px] font-normal dark:text-white",
        heading8: "text-[20px] font-normal dark:text-white",
        heading9: "text-[18px] font-normal dark:text-white",
        heading10: "text-[15px] font-normal dark:text-white",
        heading11: "text-[13px] font-normal dark:text-white",
        //medium
        heading1m: "text-[60px] font-medium dark:text-white",
        heading2m: "text-[52px] font-medium dark:text-white",
        heading3m: "text-[42px] font-medium dark:text-white",
        heading4m: "text-[38px] font-medium dark:text-white",
        heading5m: "text-[32px] font-medium dark:text-white",
        heading6m: "text-[26px] font-medium dark:text-white",
        heading7m: "text-[24px] font-medium dark:text-white",
        heading8m: "text-[20px] font-medium dark:text-white",
        heading9m: "text-[18px] font-medium dark:text-white",
        heading10m: "text-[15px] font-medium dark:text-white",
        heading11m: "text-[13px] font-medium dark:text-white",
        //semibold
        heading1sb: "text-[60px] font-semibold dark:text-white",
        heading2sb: "text-[52px] font-semibold dark:text-white",
        heading3sb: "text-[42px] font-semibold dark:text-white",
        heading4sb: "text-[38px] font-semibold dark:text-white",
        heading5sb: "text-[32px] font-semibold dark:text-white",
        heading6sb: "text-[26px] font-semibold dark:text-white",
        heading7sb: "text-[24px] font-semibold dark:text-white",
        heading8sb: "text-[20px] font-semibold dark:text-white",
        heading9sb: "text-[18px] font-semibold dark:text-white",
        heading10sb: "text-[15px] font-semibold dark:text-white",
        heading11sb: "text-[13px] font-semibold dark:text-white",
        //bold
        heading1b: "text-[60px] font-bold dark:text-white",
        heading2b: "text-[52px] font-bold dark:text-white",
        heading3b: "text-[42px] font-bold dark:text-white",
        heading4b: "text-[38px] font-bold dark:text-white",
        heading5b: "text-[32px] font-bold dark:text-white",
        heading6b: "text-[26px] font-bold dark:text-white",
        heading7b: "text-[24px] font-bold dark:text-white",
        heading8b: "text-[20px] font-bold dark:text-white",
        heading9b: "text-[18px] font-bold dark:text-white",
        heading10b: "text-[15px] font-bold dark:text-white",
        heading11b: "text-[13px] font-bold dark:text-white",
        //normal
        body1: "text-[16px] font-normal dark:text-white",
        body2: "text-[14px] font-normal dark:text-white",
        body3: "text-[12px] font-normal dark:text-white",
        caption1: "text-[12px] font-normal dark:text-white",
        caption2: "text-[11px] font-normal dark:text-white",
        //medium
        body1m: "text-[16px] font-medium dark:text-white",
        body2m: "text-[14px] font-medium dark:text-white",
        body3m: "text-[12px] font-medium dark:text-white",
        caption1m: "text-[12px] font-medium dark:text-white",
        caption2m: "text-[11px] font-medium dark:text-white",
        //semibold
        body1sb: "text-[16px] font-semibold dark:text-white",
        body2sb: "text-[14px] font-semibold dark:text-white",
        body3sb: "text-[12px] font-semibold dark:text-white",
        caption1sb: "text-[12px] font-semibold dark:text-white",
        caption2sb: "text-[11px] font-semibold dark:text-white",
        //bold
        body1b: "text-[16px] font-bold dark:text-white",
        body2b: "text-[14px] font-bold dark:text-white",
        body3b: "text-[12px] font-bold dark:text-white",
        caption1b: "text-[12px] font-bold dark:text-white",
        caption2b: "text-[11px] font-bold dark:text-white",
      },
    },
    modal: {
      base: {
        content: "p-6 rounded-xl bg-white shadow-xl",
      },

      variants: {
        modal1: { content: "max-w-[420px]" },
        modal2: { content: "max-w-[420px]" },
      },
    },
  },
});
