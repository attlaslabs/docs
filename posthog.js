!function(t,e){var o,n,p,r;e.__SV||(window.posthog && window.posthog.__loaded)||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.crossOrigin="anonymous",p.async=!0,p.src=s.api_host.replace(".i.posthog.com","-assets.i.posthog.com")+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="rn sn init kn Qr wn Cn yn capture calculateEventProperties Rn register register_once register_for_session unregister unregister_for_session An getFeatureFlag getFeatureFlagPayload getFeatureFlagResult isFeatureEnabled reloadFeatureFlags updateFlags updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures on onFeatureFlags onSurveysLoaded onSessionId getSurveys getActiveMatchingSurveys renderSurvey displaySurvey cancelPendingSurvey canRenderSurvey canRenderSurveyAsync Fn identify setPersonProperties group resetGroups setPersonPropertiesForFlags resetPersonPropertiesForFlags setGroupPropertiesForFlags resetGroupPropertiesForFlags reset setIdentity clearIdentity get_distinct_id getGroups get_session_id get_session_replay_url alias set_config startSessionRecording stopSessionRecording sessionRecordingStarted captureException addExceptionStep captureLog startExceptionAutocapture stopExceptionAutocapture loadToolbar get_property getSessionProperty On En createPersonProfile setInternalOrTestUser Ln gn $n opt_in_capturing opt_out_capturing has_opted_in_capturing has_opted_out_capturing get_explicit_consent_status is_capturing clear_opt_in_out_capturing In debug Kr Pn getPageViewId captureTraceFeedback captureTraceMetric vn".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);
posthog.init('phc_w0Wd85mUMrqNRlwBauyzX31bDWOhk3zVJf28SWs2gHU', {
    api_host: 'https://fly.attlas.so', // your managed reverse proxy domain
    ui_host: 'https://us.posthog.com', // necessary because you're using a proxy, this way links will point back to PostHog properly
    defaults: '2026-05-30',
    person_profiles: 'identified_only', // or 'always' to create profiles for anonymous users as well
});

// Localize sidebar anchors and logo link based on the current URL
(function() {
  function localizeLinks() {
    const path = window.location.pathname;
    let lang = '';
    if (path.startsWith('/fr/') || path === '/fr') {
      lang = 'fr';
    } else if (path.startsWith('/pt/') || path === '/pt') {
      lang = 'pt';
    }

    const links = document.querySelectorAll('a');
    links.forEach(a => {
      let href = a.getAttribute('href');
      if (!href) return;

      // Supprimer le slash final pour la comparaison
      const normalizedHref = href.replace(/\/$/, '');

      // Update Home link
      if (normalizedHref === 'https://attlas.so' || normalizedHref === 'https://attlas.so/fr' || normalizedHref === 'https://attlas.so/pt') {
        const target = lang ? `https://attlas.so/${lang}` : 'https://attlas.so';
        if (a.getAttribute('href') !== target) {
          a.setAttribute('href', target);
        }
      }
      
      // Update Blog link
      if (normalizedHref === 'https://attlas.so/blog' || normalizedHref === 'https://attlas.so/blog/fr' || normalizedHref === 'https://attlas.so/blog/pt') {
        const target = lang ? `https://attlas.so/blog/${lang}` : 'https://attlas.so/blog';
        if (a.getAttribute('href') !== target) {
          a.setAttribute('href', target);
        }
      }

      // Update Logo link
      if (normalizedHref === 'https://attlas.so/docs' || normalizedHref === 'https://attlas.so/docs/fr' || normalizedHref === 'https://attlas.so/docs/pt') {
        const target = lang ? `https://attlas.so/docs/${lang}` : 'https://attlas.so/docs';
        if (a.getAttribute('href') !== target) {
          a.setAttribute('href', target);
        }
      }
    });
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', localizeLinks);
    let lastPath = window.location.pathname;
    setInterval(() => {
      if (window.location.pathname !== lastPath) {
        lastPath = window.location.pathname;
        localizeLinks();
      }
    }, 500);
    localizeLinks();
    
    // MutationObserver to catch dynamically loaded anchors/elements
    try {
      const observer = new MutationObserver(localizeLinks);
      observer.observe(document.body || document.documentElement, {
        childList: true,
        subtree: true
      });
    } catch(e) {}
  }
})();
