/* global function */

window.addEventListener('DOMContentLoaded', () => {

  Global.themeInfo = {
    theme: `Redefine v${Global.theme_config.version}`,
    author: 'EvanNotFound',
    repository: 'https://github.com/EvanNotFound/hexo-theme-redefine'
  }

  Global.localStorageKey = 'Global-THEME-STATUS';

  Global.styleStatus = {
    isExpandPageWidth: false,
    isDark: false,
    fontSizeLevel: 0,
    isOpenPageAside: true
  }

  // print theme base info
  Global.printThemeInfo = () => {
    console.log(`      ______ __  __  ______  __    __  ______                       \r\n     \/\\__  _\/\\ \\_\\ \\\/\\  ___\\\/\\ \"-.\/  \\\/\\  ___\\                      \r\n     \\\/_\/\\ \\\\ \\  __ \\ \\  __\\\\ \\ \\-.\/\\ \\ \\  __\\                      \r\n        \\ \\_\\\\ \\_\\ \\_\\ \\_____\\ \\_\\ \\ \\_\\ \\_____\\                    \r\n         \\\/_\/ \\\/_\/\\\/_\/\\\/_____\/\\\/_\/  \\\/_\/\\\/_____\/                    \r\n                                                               \r\n ______  ______  _____   ______  ______ __  __   __  ______    \r\n\/\\  == \\\/\\  ___\\\/\\  __-.\/\\  ___\\\/\\  ___\/\\ \\\/\\ \"-.\\ \\\/\\  ___\\   \r\n\\ \\  __<\\ \\  __\\\\ \\ \\\/\\ \\ \\  __\\\\ \\  __\\ \\ \\ \\ \\-.  \\ \\  __\\   \r\n \\ \\_\\ \\_\\ \\_____\\ \\____-\\ \\_____\\ \\_\\  \\ \\_\\ \\_\\\\\"\\_\\ \\_____\\ \r\n  \\\/_\/ \/_\/\\\/_____\/\\\/____\/ \\\/_____\/\\\/_\/   \\\/_\/\\\/_\/ \\\/_\/\\\/_____\/\r\n                                                               \r\n  Github: https:\/\/github.com\/EvanNotFound\/hexo-theme-redefine`);
  }

  // set styleStatus to localStorage
  Global.setStyleStatus = () => {
    localStorage.setItem(Global.localStorageKey, JSON.stringify(Global.styleStatus));
  }

  // get styleStatus from localStorage
  Global.getStyleStatus = () => {
    let temp = localStorage.getItem(Global.localStorageKey);
    if (temp) {
      temp = JSON.parse(temp);
      for (let key in Global.styleStatus) {
        Global.styleStatus[key] = temp[key];
      }
      return temp;
    } else {
      return null;
    }
  }

  Global.refresh = () => {
    Global.initUtils();
    navbarShrink.init();
    if (Global.data_config.masonry) {
      Global.initMasonry();
    }
    Global.initModeToggle();
    Global.initBackToTop();
    if (Global.theme_config.home_banner.subtitle.text.length !== 0  && location.pathname === Global.hexo_config.root) {
      Global.initTyped('subtitle');
    }

    if (Global.theme_config.plugins.mermaid.enable === true) {
      Global.initMermaid();
    }

    if (Global.theme_config.navbar.search.enable === true) {
      Global.initLocalSearch();
    }

    if (Global.theme_config.articles.code_block.copy === true) {
      Global.initCopyCode();
    }

    if (Global.theme_config.articles.lazyload === true) {
      Global.initLazyLoad();
    }

  }

  Global.printThemeInfo();
  Global.refresh();
});

// fireworks
document.addEventListener("click", e => {
  const count = 12;
  const colors = ["#f7c0c1ff", "#f3ba75ff", "#40a9ff", "#73d13d", "#9254de"];

  for (let i = 0; i < count; i++) {
    const p = document.createElement("span");
    p.style.position = "fixed";
    p.style.left = e.clientX + "px";
    p.style.top = e.clientY + "px";
    p.style.width = "6px";
    p.style.height = "6px";
    p.style.borderRadius = "50%";
    p.style.background = colors[Math.floor(Math.random() * colors.length)];
    p.style.pointerEvents = "none";
    p.style.zIndex = 9999;

    const angle = (Math.PI * 2 * i) / count;
    const distance = Math.random() * 80 + 20;

    p.animate(
      [
        { transform: "translate(0, 0)", opacity: 1 },
        {
          transform: `translate(${Math.cos(angle) * distance}px, ${Math.sin(angle) * distance}px)`,
          opacity: 0
        }
      ],
      { duration: 700, easing: "ease-out" }
    );

    document.body.appendChild(p);
    setTimeout(() => p.remove(), 700);
  }
});