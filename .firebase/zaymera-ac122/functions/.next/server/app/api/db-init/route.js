(()=>{var a={};a.id=151,a.ids=[151],a.modules={261:a=>{"use strict";a.exports=require("next/dist/shared/lib/router/utils/app-paths")},3295:a=>{"use strict";a.exports=require("next/dist/server/app-render/after-task-async-storage.external.js")},10846:a=>{"use strict";a.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},19121:a=>{"use strict";a.exports=require("next/dist/server/app-render/action-async-storage.external.js")},29294:a=>{"use strict";a.exports=require("next/dist/server/app-render/work-async-storage.external.js")},32475:(a,b,c)=>{"use strict";c.r(b),c.d(b,{handler:()=>F,patchFetch:()=>E,routeModule:()=>A,serverHooks:()=>D,workAsyncStorage:()=>B,workUnitAsyncStorage:()=>C});var d={};c.r(d),c.d(d,{GET:()=>z,dynamic:()=>w});var e=c(95736),f=c(9117),g=c(4044),h=c(39326),i=c(32324),j=c(261),k=c(54290),l=c(85328),m=c(38928),n=c(46595),o=c(3421),p=c(17679),q=c(41681),r=c(63446),s=c(86439),t=c(51356),u=c(10641),v=c(5903);let w="force-dynamic",x={products:`
    CREATE TABLE IF NOT EXISTS public.products (
      id              TEXT        PRIMARY KEY,
      name            TEXT        NOT NULL,
      category        TEXT        NOT NULL DEFAULT '',
      price           NUMERIC     NOT NULL DEFAULT 0,
      original_price  NUMERIC     NOT NULL DEFAULT 0,
      purchased_price NUMERIC,
      image           TEXT        NOT NULL DEFAULT '',
      images          JSONB       NOT NULL DEFAULT '[]',
      tag             TEXT        NOT NULL DEFAULT 'New Arrival',
      description     TEXT        NOT NULL DEFAULT '',
      fabric          TEXT        NOT NULL DEFAULT '',
      work            TEXT        NOT NULL DEFAULT '',
      in_stock        BOOLEAN     NOT NULL DEFAULT TRUE,
      sizes           JSONB       NOT NULL DEFAULT '[]',
      section         TEXT        NOT NULL DEFAULT 'products',
      created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;
  `,categories:`
    CREATE TABLE IF NOT EXISTS public.categories (
      id          TEXT        PRIMARY KEY,
      title       TEXT        NOT NULL,
      slug        TEXT        NOT NULL UNIQUE,
      count       TEXT        NOT NULL DEFAULT '0 Styles',
      image       TEXT        NOT NULL DEFAULT '',
      description TEXT        NOT NULL DEFAULT '',
      featured    BOOLEAN     NOT NULL DEFAULT FALSE,
      sort_order  INTEGER     NOT NULL DEFAULT 0,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    ALTER TABLE public.categories DISABLE ROW LEVEL SECURITY;
  `,orders:`
    CREATE TABLE IF NOT EXISTS public.orders (
      id               TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
      user_id          TEXT,
      order_number     TEXT        NOT NULL UNIQUE,
      customer_name    TEXT        NOT NULL,
      customer_email   TEXT        NOT NULL,
      customer_phone   TEXT        NOT NULL DEFAULT '',
      shipping_address JSONB       NOT NULL DEFAULT '{}',
      subtotal         NUMERIC     NOT NULL DEFAULT 0,
      shipping_fee     NUMERIC     NOT NULL DEFAULT 0,
      total            NUMERIC     NOT NULL DEFAULT 0,
      payment_method   TEXT        NOT NULL DEFAULT 'COD',
      payment_status   TEXT        NOT NULL DEFAULT 'pending',
      order_status     TEXT        NOT NULL DEFAULT 'processing',
      notes            TEXT,
      created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    ALTER TABLE public.orders DISABLE ROW LEVEL SECURITY;
  `,order_items:`
    CREATE TABLE IF NOT EXISTS public.order_items (
      id            TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
      order_id      TEXT        NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
      product_id    TEXT,
      product_name  TEXT        NOT NULL,
      product_image TEXT        NOT NULL DEFAULT '',
      size          TEXT        NOT NULL DEFAULT '',
      price         NUMERIC     NOT NULL DEFAULT 0,
      quantity      INTEGER     NOT NULL DEFAULT 1,
      created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    ALTER TABLE public.order_items DISABLE ROW LEVEL SECURITY;
  `,inquiries:`
    CREATE TABLE IF NOT EXISTS public.inquiries (
      id           TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
      name         TEXT        NOT NULL,
      email        TEXT        NOT NULL,
      phone        TEXT        NOT NULL DEFAULT '',
      service_type TEXT        NOT NULL DEFAULT 'General Inquiry',
      message      TEXT        NOT NULL,
      status       TEXT        NOT NULL DEFAULT 'new',
      notes        TEXT,
      created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    ALTER TABLE public.inquiries DISABLE ROW LEVEL SECURITY;
  `,coupons:`
    CREATE TABLE IF NOT EXISTS public.coupons (
      id            TEXT        PRIMARY KEY,
      code          TEXT        NOT NULL UNIQUE,
      discount_type TEXT        NOT NULL DEFAULT 'percentage',
      value         NUMERIC     NOT NULL DEFAULT 0,
      min_spend     NUMERIC     NOT NULL DEFAULT 0,
      expiry_date   DATE        NOT NULL DEFAULT (NOW() + INTERVAL '1 year')::DATE,
      usage_limit   INTEGER     NOT NULL DEFAULT 100,
      times_used    INTEGER     NOT NULL DEFAULT 0,
      active        BOOLEAN     NOT NULL DEFAULT TRUE,
      created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    ALTER TABLE public.coupons DISABLE ROW LEVEL SECURITY;
  `,banners:`
    CREATE TABLE IF NOT EXISTS public.banners (
      id         TEXT        PRIMARY KEY,
      title      TEXT        NOT NULL,
      subtitle   TEXT        NOT NULL DEFAULT '',
      image      TEXT        NOT NULL DEFAULT '',
      link       TEXT        NOT NULL DEFAULT '',
      sort_order INTEGER     NOT NULL DEFAULT 0,
      active     BOOLEAN     NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    ALTER TABLE public.banners DISABLE ROW LEVEL SECURITY;
  `,store_settings:`
    CREATE TABLE IF NOT EXISTS public.store_settings (
      id                      TEXT    PRIMARY KEY DEFAULT 'global',
      announcement_text       TEXT    NOT NULL DEFAULT 'Complimentary Express Worldwide Delivery & Handloom Guarantee',
      concierge_phone         TEXT    NOT NULL DEFAULT '+91 98765 43210',
      support_email           TEXT    NOT NULL DEFAULT 'atelier@zaymera.com',
      free_shipping_threshold NUMERIC NOT NULL DEFAULT 0,
      store_timings           TEXT    NOT NULL DEFAULT '10:00 AM – 9:00 PM IST',
      currency_symbol         TEXT    NOT NULL DEFAULT '₹',
      whatsapp_message        TEXT    NOT NULL DEFAULT 'Hello Zaymera Boutique Team, I would like to inquire about couture items.',
      updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    ALTER TABLE public.store_settings DISABLE ROW LEVEL SECURITY;
    INSERT INTO public.store_settings (id) VALUES ('global') ON CONFLICT (id) DO NOTHING;
  `},y=[{id:"product-images",name:"product-images",public:!0,fileSizeLimit:0xa00000},{id:"category-images",name:"category-images",public:!0,fileSizeLimit:0xa00000},{id:"banner-images",name:"banner-images",public:!0,fileSizeLimit:0xa00000}];async function z(){let a=function(){let a=process.env.SUPABASE_SERVICE_ROLE_KEY||"",b=a&&!a.includes("your-")&&!a.includes("placeholder")&&a.length>30?a:"sb_publishable_rgRcgkDfPPbnAa-PO8ODQg_MqtMAIrE";return(0,v.UU)("https://hvhxdjkhodjdqysqziew.supabase.co",b,{auth:{autoRefreshToken:!1,persistSession:!1}})}(),b={tables:{},buckets:{},errors:[]};for(let[c,d]of Object.entries(x))try{let{error:e}=await a.from(c).select("id").limit(1);if(!e){b.tables[c]="exists";continue}let{error:f}=await a.rpc("exec_sql",{sql:d});f?(b.tables[c]="error",b.errors.push(`Table "${c}": ${f.message} — run supabase/schema.sql manually`)):b.tables[c]="created"}catch(a){b.tables[c]="error",b.errors.push(`Table "${c}": ${a?.message}`)}for(let c of y)try{let{data:d}=await a.storage.getBucket(c.id);if(d){b.buckets[c.id]="exists";continue}let{error:e}=await a.storage.createBucket(c.id,{public:c.public,fileSizeLimit:c.fileSizeLimit,allowedMimeTypes:["image/jpeg","image/jpg","image/png","image/webp","image/gif"]});e?(b.buckets[c.id]="error",b.errors.push(`Bucket "${c.id}": ${e.message}`)):b.buckets[c.id]="created"}catch(a){b.buckets[c.id]="error",b.errors.push(`Bucket "${c.id}": ${a?.message}`)}let c=b.errors.length>0;return u.NextResponse.json({success:!c,message:c?"Partial setup — see errors. Run supabase/schema.sql in SQL Editor for full setup.":"All tables and buckets are ready!",report:b},{status:c?207:200})}let A=new e.AppRouteRouteModule({definition:{kind:f.RouteKind.APP_ROUTE,page:"/api/db-init/route",pathname:"/api/db-init",filename:"route",bundlePath:"app/api/db-init/route"},distDir:".next",relativeProjectDir:"",resolvedPagePath:"D:\\shahzad\\zaymera new\\src\\app\\api\\db-init\\route.ts",nextConfigOutput:"",userland:d}),{workAsyncStorage:B,workUnitAsyncStorage:C,serverHooks:D}=A;function E(){return(0,g.patchFetch)({workAsyncStorage:B,workUnitAsyncStorage:C})}async function F(a,b,c){var d;let e="/api/db-init/route";"/index"===e&&(e="/");let g=await A.prepare(a,b,{srcPage:e,multiZoneDraftMode:!1});if(!g)return b.statusCode=400,b.end("Bad Request"),null==c.waitUntil||c.waitUntil.call(c,Promise.resolve()),null;let{buildId:u,params:v,nextConfig:w,isDraftMode:x,prerenderManifest:y,routerServerContext:z,isOnDemandRevalidate:B,revalidateOnlyGenerated:C,resolvedPathname:D}=g,E=(0,j.normalizeAppPath)(e),F=!!(y.dynamicRoutes[E]||y.routes[D]);if(F&&!x){let a=!!y.routes[D],b=y.dynamicRoutes[E];if(b&&!1===b.fallback&&!a)throw new s.NoFallbackError}let G=null;!F||A.isDev||x||(G="/index"===(G=D)?"/":G);let H=!0===A.isDev||!F,I=F&&!H,J=a.method||"GET",K=(0,i.getTracer)(),L=K.getActiveScopeSpan(),M={params:v,prerenderManifest:y,renderOpts:{experimental:{cacheComponents:!!w.experimental.cacheComponents,authInterrupts:!!w.experimental.authInterrupts},supportsDynamicResponse:H,incrementalCache:(0,h.getRequestMeta)(a,"incrementalCache"),cacheLifeProfiles:null==(d=w.experimental)?void 0:d.cacheLife,isRevalidate:I,waitUntil:c.waitUntil,onClose:a=>{b.on("close",a)},onAfterTaskError:void 0,onInstrumentationRequestError:(b,c,d)=>A.onRequestError(a,b,d,z)},sharedContext:{buildId:u}},N=new k.NodeNextRequest(a),O=new k.NodeNextResponse(b),P=l.NextRequestAdapter.fromNodeNextRequest(N,(0,l.signalFromNodeResponse)(b));try{let d=async c=>A.handle(P,M).finally(()=>{if(!c)return;c.setAttributes({"http.status_code":b.statusCode,"next.rsc":!1});let d=K.getRootSpanAttributes();if(!d)return;if(d.get("next.span_type")!==m.BaseServerSpan.handleRequest)return void console.warn(`Unexpected root span type '${d.get("next.span_type")}'. Please report this Next.js issue https://github.com/vercel/next.js`);let e=d.get("next.route");if(e){let a=`${J} ${e}`;c.setAttributes({"next.route":e,"http.route":e,"next.span_name":a}),c.updateName(a)}else c.updateName(`${J} ${a.url}`)}),g=async g=>{var i,j;let k=async({previousCacheEntry:f})=>{try{if(!(0,h.getRequestMeta)(a,"minimalMode")&&B&&C&&!f)return b.statusCode=404,b.setHeader("x-nextjs-cache","REVALIDATED"),b.end("This page could not be found"),null;let e=await d(g);a.fetchMetrics=M.renderOpts.fetchMetrics;let i=M.renderOpts.pendingWaitUntil;i&&c.waitUntil&&(c.waitUntil(i),i=void 0);let j=M.renderOpts.collectedTags;if(!F)return await (0,o.I)(N,O,e,M.renderOpts.pendingWaitUntil),null;{let a=await e.blob(),b=(0,p.toNodeOutgoingHttpHeaders)(e.headers);j&&(b[r.NEXT_CACHE_TAGS_HEADER]=j),!b["content-type"]&&a.type&&(b["content-type"]=a.type);let c=void 0!==M.renderOpts.collectedRevalidate&&!(M.renderOpts.collectedRevalidate>=r.INFINITE_CACHE)&&M.renderOpts.collectedRevalidate,d=void 0===M.renderOpts.collectedExpire||M.renderOpts.collectedExpire>=r.INFINITE_CACHE?void 0:M.renderOpts.collectedExpire;return{value:{kind:t.CachedRouteKind.APP_ROUTE,status:e.status,body:Buffer.from(await a.arrayBuffer()),headers:b},cacheControl:{revalidate:c,expire:d}}}}catch(b){throw(null==f?void 0:f.isStale)&&await A.onRequestError(a,b,{routerKind:"App Router",routePath:e,routeType:"route",revalidateReason:(0,n.c)({isRevalidate:I,isOnDemandRevalidate:B})},z),b}},l=await A.handleResponse({req:a,nextConfig:w,cacheKey:G,routeKind:f.RouteKind.APP_ROUTE,isFallback:!1,prerenderManifest:y,isRoutePPREnabled:!1,isOnDemandRevalidate:B,revalidateOnlyGenerated:C,responseGenerator:k,waitUntil:c.waitUntil});if(!F)return null;if((null==l||null==(i=l.value)?void 0:i.kind)!==t.CachedRouteKind.APP_ROUTE)throw Object.defineProperty(Error(`Invariant: app-route received invalid cache entry ${null==l||null==(j=l.value)?void 0:j.kind}`),"__NEXT_ERROR_CODE",{value:"E701",enumerable:!1,configurable:!0});(0,h.getRequestMeta)(a,"minimalMode")||b.setHeader("x-nextjs-cache",B?"REVALIDATED":l.isMiss?"MISS":l.isStale?"STALE":"HIT"),x&&b.setHeader("Cache-Control","private, no-cache, no-store, max-age=0, must-revalidate");let m=(0,p.fromNodeOutgoingHttpHeaders)(l.value.headers);return(0,h.getRequestMeta)(a,"minimalMode")&&F||m.delete(r.NEXT_CACHE_TAGS_HEADER),!l.cacheControl||b.getHeader("Cache-Control")||m.get("Cache-Control")||m.set("Cache-Control",(0,q.getCacheControlHeader)(l.cacheControl)),await (0,o.I)(N,O,new Response(l.value.body,{headers:m,status:l.value.status||200})),null};L?await g(L):await K.withPropagatedContext(a.headers,()=>K.trace(m.BaseServerSpan.handleRequest,{spanName:`${J} ${a.url}`,kind:i.SpanKind.SERVER,attributes:{"http.method":J,"http.target":a.url}},g))}catch(b){if(b instanceof s.NoFallbackError||await A.onRequestError(a,b,{routerKind:"App Router",routePath:E,routeType:"route",revalidateReason:(0,n.c)({isRevalidate:I,isOnDemandRevalidate:B})}),F)throw b;return await (0,o.I)(N,O,new Response(null,{status:500})),null}}},44870:a=>{"use strict";a.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},63033:a=>{"use strict";a.exports=require("next/dist/server/app-render/work-unit-async-storage.external.js")},78335:()=>{},86439:a=>{"use strict";a.exports=require("next/dist/shared/lib/no-fallback-error.external")},96487:()=>{}};var b=require("../../../webpack-runtime.js");b.C(a);var c=b.X(0,[331,308],()=>b(b.s=32475));module.exports=c})();