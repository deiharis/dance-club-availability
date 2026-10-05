// "Closing every tab logs you out."
// Each open tab of the site keeps a heartbeat in localStorage (TABS_KEY: { tabId: lastSeenMs }) and
// removes it when the tab closes (components/IdleLogout.tsx). sessionStorage (TAB_FLAG) survives a
// refresh but not a new tab or a reopened browser. So when a page loads in a NEW tab and no other
// tab of the site is alive, the user is signed out before anything is shown.
export const TABS_KEY = "dc-tabs";
export const TAB_FLAG = "dc-tab";
// ponytail: a crashed browser leaves its heartbeat for up to 90s (hidden tabs only tick about
// once a minute, so a shorter window would sign out people who still have a tab open).
export const TAB_ALIVE_MS = 90 * 1000;

// Runs in <body> before the page paints (app/layout.tsx). On /login it just marks the tab, so the
// tab you sign in from counts as yours. Elsewhere, a new tab with no live sibling gets
// <html data-locked>, which globals.css hides until IdleLogout signs the user out.
export const TAB_EARLY_CHECK = `(function(){try{
if(location.pathname==='/login'){sessionStorage.setItem('${TAB_FLAG}','1');return}
if(sessionStorage.getItem('${TAB_FLAG}'))return;
var t=JSON.parse(localStorage.getItem('${TABS_KEY}')||'{}'),n=Date.now();
for(var k in t){if(n-t[k]<${TAB_ALIVE_MS}){sessionStorage.setItem('${TAB_FLAG}','1');return}}
document.documentElement.setAttribute('data-locked','1');
}catch(e){}})();`;
