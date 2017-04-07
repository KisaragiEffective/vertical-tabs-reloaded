/* ***** BEGIN LICENSE BLOCK *****
 *
 * This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0.
 * If a copy of the MPL was not distributed with this file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * ***** END LICENSE BLOCK ***** */

"use strict";


var main = browser.extension.getBackgroundPage();

/* Object injected for every window */
var VerticalTabsReloaded = class VerticalTabsReloaded
{
    constructor(window, preferences)
    {
        //this.main = main;
        this.window = window;
        this.document = window.document;
        this.webExtPreferences = preferences;
        this.changedDisplayState = false;
        this.unloaders = [];


        this.tabbrowser = this.document.getElementById("tabbrowser-tabs");

        this.init();
    }

    init()
    {
        this.debug_log(this.webExtPreferences);
        this.window.VerticalTabsReloaded = this;
        //this.unloaders.push(function() {
            //delete this.window.VerticalTabsReloaded;
        //});

        this.build_ui();
        this.initEventListeners();
    }

    preferences(settingName)
    {
        this.debug_log(settingName + " (webext lib): " + this.webExtPreferences[settingName]);
        return this.webExtPreferences[settingName];
    }

    installStylesheet(uri, type)
    {
        this.debug_log("VTR install sheet: " + uri + " of type: " + type);
        this.tabbrowser.insertAdjacentHTML('beforeend', '<link rel="stylesheet" href="'+uri +'" id="vtr-'+type+'">');
    }

    removeStylesheet(type)
    {
        this.debug_log("VTR remove sheet of type: " + type);
        this.document.getElementById("vtr-"+type).remove();
    }

    applyThemeStylesheet()
    {
        if(this.preferences("theme") != "none")
        {
            /*main.css_get_full_path().then(fullPath => {
                this.installStylesheet(fullPath);
            });*/

            this.installStylesheet( this.getThemeStylesheet(this.preferences("theme")), "theme" );
        }
    }

    removeThemeStylesheet()
    {
        if(this.preferences("theme") != "none")
        {
            this.debug_log("remove theme stylesheet!");
            this.removeStylesheet("theme");
        }
    }

    getThemeStylesheet(theme)
    {
        var stylesheet;
        switch (theme)
        {
            default:
                stylesheet = "data/theme/"+theme+"/index.css";
                break;
        }

        return browser.runtime.getURL(stylesheet);
    }

    build_ui()
    {
        // FIREFIX: Placeholder. Firefox doesn't support hiding the default tabbrowser currently.


        // Injecting CSS
        this.debug_log("apply stylesheets");
        this.installStylesheet(browser.runtime.getURL("theme/base.css"), "base");
        this.applyThemeStylesheet();
        if (this.preferences("compact") == true)
        {
            this.debug_log("compact true");
            this.installStylesheet(browser.runtime.getURL("compact.css"), "compact");
        }

        if (this.preferences("style.tab.status") == true)
        {
            this.debug_log("style.tab.status true");
            this.installStylesheet(browser.runtime.getURL("status.css"), "status");
        }

        // FIREFIX: Placeholder. Sidebars on the right are currently not suppoted by Firefox.
        //if (this.preferences("right"))

        // Placeholder. Restore width of tab bar from previous session
        //tabs.setAttribute("width", this.preferences("width"));
        // FIREFIX: Firefox doesn't support resizing the sidebar programmatically currently.

        // FIREFIX: Firefox doesn't supporting the moving of toolbars. https://bugzilla.mozilla.org/show_bug.cgi?id=1344959
        //if (this.preferences("tabtoolbarPosition") == "top")
        //{
            //leftbox.insertBefore(toolbar, leftbox.firstChild);
        //}
        //else
        //{
            //leftbox.appendChild(toolbar);
        //}


        // FIXME: Init every tab
        //tabs.addEventListener("TabOpen", this, false);
        //for (let i=0; i < tabs.childNodes.length; i++)
        //{
            //this.initTab(tabs.childNodes[i]);
        //}

        this.unloaders.push(() =>
        {
            // FIXME: Put the tabs back up, unhide tabstrip

            // FIXME: Properly not necessary since sidebars are totally isolated and are just getting "deleted" on closing
            //this.removeThemeStylesheet();
        });
    }

    initTab(aTab)
    {
        aTab.setAttribute("align", "stretch");
        aTab.maxWidth = 65000;
        aTab.minWidth = 0;
    }

    setPinnedSizes()
    {
        //this.debug_log("set pinned sizes!");
    }

    onPreferenceChange(prefName, newValue)
    {
        switch (prefName)
        {
            //case "right":
                //this.webExtPreferences = newValue;
                // Placeholder.
                //break;

            //case "tabtoolbarPosition":
                //this.webExtPreferences = newValue;
                // Placeholder.
                //break;

            case "theme":
                this.removeThemeStylesheet();
                this.webExtPreferences[prefName] = newValue;
                this.applyThemeStylesheet();
                break;

            case "compact":
                this.webExtPreferences[prefName] = newValue;
                if (this.preferences("compact") == true)
                {
                    this.installStylesheet(browser.runtime.getURL("compact.css"), "compact");
                }
                else
                {
                    this.removeStylesheet("compact");
                }
                break;

            case "style.tab.status":
                this.webExtPreferences[prefName] = newValue;
                if (this.preferences("style.tab.status") == true)
                {
                    this.installStylesheet(browser.runtime.getURL("status.css"), "status");
                }
                else
                {
                    this.removeStylesheet("status");
                }
                break;

            default:
                this.webExtPreferences[prefName] = newValue;
                break;
        }
    }

    on_storage_change_iterator(changes, area)
    {
        /* area = placeholder FIXME */

        Object.keys(changes).forEach(item =>
        {
            this.debug_log("on_storage: " + item + " " + changes[item].newValue);
            this.onPreferenceChange(item, changes[item].newValue);
        });
    }

    initEventListeners()
    {
        // Note: Not all eventsListener are set up here

        browser.storage.onChanged.addListener((changes, area) => { this.on_storage_change_iterator(changes, area); });

        //this.window.addEventListener("resize", this, false);

        //this.unloaders.push(function()
        //{
            //this.window.removeEventListener("resize", this, false);
        //});
    }

    // Event handlers
    handleEvent(aEvent)
    {
        //debug_log("aEvent.type: "+aEvent.type);
        switch (aEvent.type)
        {
            case "TabOpen":
                this.initTab(aEvent.target);
                this.setPinnedSizes();
                return;
            case "mouseup":
                if (aEvent.target.getAttribute("id") == "verticaltabs-splitter")
                {
                    this.onTabbarResized();
                }
                return;
            //case "popupshowing":
                //return;
            case "resize":
                this.setPinnedSizes();
                return;
        }
    }

    toggleDisplayState()
    {
        // FIREFIX: Not yet able to read the status of the sidebar.

        /*const document = this.document;

        if(document.getElementById("verticaltabs-box").style.display == "")
        {
            this.changeDisplayState("none");
            this.changedDisplayState = true;
        }
        else
        {
            this.changeDisplayState("");
            this.changedDisplayState = false;
        }*/
    }

    changeDisplayState(display)
    {

        const document = this.document;

        let tabs = document.getElementById("verticaltabs-box").style;
        let splitter = document.getElementById("verticaltabs-splitter").style;

        if (tabs.display == display && splitter.display == display)
        {
            return;
        }

        tabs.display = splitter.display = display;
    }

    /* Enter/Left fullscreen mode */
    changeFullscreenMode(state)
    {
        if(this.changedDisplayState == true)
        {
            return;
        }

        this.debug_log("changeFullscreenMode " + state);
        if(state == "true")
        {
            this.changeDisplayState("none");
        }
        else
        {
            this.changeDisplayState("");
        }
    }

    unload()
    {
        this.unloaders.forEach(function(func)
        {
            func.call(this);
        }, this);

        this.unloaders = [];
    }

    debug_log(output)
    {
        main.debug_log(output);
    }

}

document.addEventListener('DOMContentLoaded', function()
{
    main.get_setting().then(value =>
    {
        var VTR = new VerticalTabsReloaded(window, value);
    });

});

//exports.VerticalTabsReloaded = VerticalTabsReloaded;