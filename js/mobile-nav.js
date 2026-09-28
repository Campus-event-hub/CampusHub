(function () {
     const currentScript = document.currentScript;
     const stylesheet = document.createElement("link");
     stylesheet.rel = "stylesheet";
     stylesheet.href = new URL("../css/mobile-nav.css", currentScript.src).href;
     document.head.append(stylesheet);

     document.querySelectorAll("header").forEach((header, index) => {
          const nav = header.querySelector('nav[aria-label="Main navigation"]');

          if (!nav || !header.querySelector(":scope > div")) return;

          header.classList.add("campushub-mobile-header");

          if (!nav.id) nav.id = `campushub-navigation-${index + 1}`;

          let toggle = header.querySelector(".campushub-mobile-toggle");

          if (!toggle) {
               toggle = document.createElement("button");
               toggle.type = "button";
               toggle.className = "campushub-mobile-toggle";
               toggle.setAttribute("aria-label", "Open navigation menu");
               toggle.setAttribute("aria-expanded", "false");
               toggle.setAttribute("aria-controls", nav.id);
               toggle.innerHTML = '<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" d="M4 6h16M4 12h16M4 18h16"></path></svg>';
               nav.before(toggle);

               toggle.addEventListener("click", () => {
                    const open = nav.dataset.mobileOpen !== "true";
                    nav.dataset.mobileOpen = String(open);
                    toggle.setAttribute("aria-expanded", String(open));
                    toggle.setAttribute("aria-label", open ? "Close navigation menu" : "Open navigation menu");
               });
          }

          nav.dataset.mobileOpen = "false";

          nav.addEventListener("click", (event) => {
               if (event.target.closest("a")) closeMenu();
          });

          document.addEventListener("click", (event) => {
               if (!header.contains(event.target)) closeMenu();
          });

          document.addEventListener("keydown", (event) => {
               if (event.key === "Escape") closeMenu();
          });

          function closeMenu() {
               nav.dataset.mobileOpen = "false";
               toggle.setAttribute("aria-expanded", "false");
               toggle.setAttribute("aria-label", "Open navigation menu");
          }
     });
})();