/**
 * Service worker registration for PWA
 */

export function register() {
  if (typeof window === "undefined") {
    return;
  }

  if (process.env.NODE_ENV === "production") {
    const publicUrl = new URL(process.env.PUBLIC_URL || "", window.location.href);
    if (publicUrl.origin !== window.location.origin) {
      return;
    }

    window.addEventListener("load", () => {
      const swUrl = "/sw.js";

      navigator.serviceWorker
        .register(swUrl)
        .then((registration) => {
          console.log("Service worker registered:", registration);

          // Check for updates
          setInterval(() => {
            registration.update();
          }, 60 * 60 * 1000); // Check every hour
        })
        .catch((error) => {
          console.error("Service worker registration failed:", error);
        });
    });
  }
}

export function unregister() {
  if (typeof window === "undefined") {
    return;
  }

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister();
      })
      .catch((error) => {
        console.error(error.message);
      });
  }
}
