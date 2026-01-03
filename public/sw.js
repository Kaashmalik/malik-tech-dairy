if (!self.define) {
  let e,
    a = {};
  const s = (s, i) => (
    (s = new URL(s + '.js', i).href),
    a[s] ||
      new Promise(a => {
        if ('document' in self) {
          const e = document.createElement('script');
          ((e.src = s), (e.onload = a), document.head.appendChild(e));
        } else ((e = s), importScripts(s), a());
      }).then(() => {
        let e = a[s];
        if (!e) throw new Error(`Module ${s} didn’t register its module`);
        return e;
      })
  );
  self.define = (i, t) => {
    const n = e || ('document' in self ? document.currentScript.src : '') || location.href;
    if (a[n]) return;
    let c = {};
    const r = e => s(e, n),
      d = { module: { uri: n }, exports: c, require: r };
    a[n] = Promise.all(i.map(e => d[e] || r(e))).then(e => (t(...e), c));
  };
}
define(['./workbox-8e5392e7'], function (e) {
  'use strict';
  (importScripts(),
    self.skipWaiting(),
    e.clientsClaim(),
    e.precacheAndRoute(
      [
        { url: '/_next/app-build-manifest.json', revision: '4f741c9c5dc71ce796d474ffc90848b3' },
        { url: '/_next/static/chunks/1029-3ef9e7fa38612fae.js', revision: '3ef9e7fa38612fae' },
        { url: '/_next/static/chunks/1163-75a92872931ec62c.js', revision: '75a92872931ec62c' },
        { url: '/_next/static/chunks/1255-2515ec02460e7abe.js', revision: '2515ec02460e7abe' },
        { url: '/_next/static/chunks/1273-a1ab8d142188b77b.js', revision: 'a1ab8d142188b77b' },
        { url: '/_next/static/chunks/1291-7de5aa4557d2b5e8.js', revision: '7de5aa4557d2b5e8' },
        { url: '/_next/static/chunks/1496-da2e35d6b76c9df7.js', revision: 'da2e35d6b76c9df7' },
        { url: '/_next/static/chunks/1601-e780e3a9f6777d9e.js', revision: 'e780e3a9f6777d9e' },
        { url: '/_next/static/chunks/1646.a93085a0445ba909.js', revision: 'a93085a0445ba909' },
        { url: '/_next/static/chunks/1805-fa3f957e0e346348.js', revision: 'fa3f957e0e346348' },
        { url: '/_next/static/chunks/2221-a857ddd10c51da57.js', revision: 'a857ddd10c51da57' },
        { url: '/_next/static/chunks/2366-a87ecc0b8b158082.js', revision: 'a87ecc0b8b158082' },
        { url: '/_next/static/chunks/2454-b8c5c791c111c4c0.js', revision: 'b8c5c791c111c4c0' },
        { url: '/_next/static/chunks/2544-1deee15b02785301.js', revision: '1deee15b02785301' },
        { url: '/_next/static/chunks/2619-04bc32f026a0d946.js', revision: '04bc32f026a0d946' },
        { url: '/_next/static/chunks/2933-5f33cb2e806d6b63.js', revision: '5f33cb2e806d6b63' },
        { url: '/_next/static/chunks/3336-f038e7989632ef73.js', revision: 'f038e7989632ef73' },
        { url: '/_next/static/chunks/3357-11b39f86d1ce2e8e.js', revision: '11b39f86d1ce2e8e' },
        { url: '/_next/static/chunks/3416-405ba55576040c2d.js', revision: '405ba55576040c2d' },
        { url: '/_next/static/chunks/3719-9301127e425e1dd0.js', revision: '9301127e425e1dd0' },
        { url: '/_next/static/chunks/382-c08d9ee03fb8aca7.js', revision: 'c08d9ee03fb8aca7' },
        { url: '/_next/static/chunks/3944.54cac32bfbeddb86.js', revision: '54cac32bfbeddb86' },
        { url: '/_next/static/chunks/4120-b558576dbe2a6050.js', revision: 'b558576dbe2a6050' },
        { url: '/_next/static/chunks/4146-00674a50ab68f998.js', revision: '00674a50ab68f998' },
        { url: '/_next/static/chunks/4220-ac1d3979dd22585c.js', revision: 'ac1d3979dd22585c' },
        { url: '/_next/static/chunks/4415-50ab9fa0a78ad6af.js', revision: '50ab9fa0a78ad6af' },
        { url: '/_next/static/chunks/4538-222f2c82dd7aa752.js', revision: '222f2c82dd7aa752' },
        { url: '/_next/static/chunks/4550.ed17272cfcd81bc0.js', revision: 'ed17272cfcd81bc0' },
        { url: '/_next/static/chunks/4554-984b480a9db5f3fe.js', revision: '984b480a9db5f3fe' },
        { url: '/_next/static/chunks/468-09bb3809a6e6e29a.js', revision: '09bb3809a6e6e29a' },
        { url: '/_next/static/chunks/4703-b3f11208da21cb54.js', revision: 'b3f11208da21cb54' },
        { url: '/_next/static/chunks/4bd1b696-182b6b13bdad92e3.js', revision: '182b6b13bdad92e3' },
        { url: '/_next/static/chunks/5139.e4ff9cc3669129ed.js', revision: 'e4ff9cc3669129ed' },
        { url: '/_next/static/chunks/5149-99b6c78ab50f5499.js', revision: '99b6c78ab50f5499' },
        { url: '/_next/static/chunks/5811.be36fbb8f5f0d257.js', revision: 'be36fbb8f5f0d257' },
        { url: '/_next/static/chunks/5924-d6fc2943effba814.js', revision: 'd6fc2943effba814' },
        { url: '/_next/static/chunks/5929-d484bf7669898d67.js', revision: 'd484bf7669898d67' },
        { url: '/_next/static/chunks/5941-aa9d0a32edf49e14.js', revision: 'aa9d0a32edf49e14' },
        { url: '/_next/static/chunks/6223-39db4d3cb367bb87.js', revision: '39db4d3cb367bb87' },
        { url: '/_next/static/chunks/6339-fa5f488a6fe6dc51.js', revision: 'fa5f488a6fe6dc51' },
        { url: '/_next/static/chunks/6416-a388994c8ea2253a.js', revision: 'a388994c8ea2253a' },
        { url: '/_next/static/chunks/660-07b5adfa1deceba1.js', revision: '07b5adfa1deceba1' },
        { url: '/_next/static/chunks/7219-712b99aeb83bf5fc.js', revision: '712b99aeb83bf5fc' },
        { url: '/_next/static/chunks/7397.cf4ec692f4b056ba.js', revision: 'cf4ec692f4b056ba' },
        { url: '/_next/static/chunks/7455-3d990d00e6254a5c.js', revision: '3d990d00e6254a5c' },
        { url: '/_next/static/chunks/8649-ad73e2f8bfe69cfb.js', revision: 'ad73e2f8bfe69cfb' },
        { url: '/_next/static/chunks/89-4de3c92b0e8241ea.js', revision: '4de3c92b0e8241ea' },
        { url: '/_next/static/chunks/8912-caf30b6e75bd6368.js', revision: 'caf30b6e75bd6368' },
        { url: '/_next/static/chunks/8972-31818d24b575ceff.js', revision: '31818d24b575ceff' },
        { url: '/_next/static/chunks/9236-287dcdc0ccf286ac.js', revision: '287dcdc0ccf286ac' },
        { url: '/_next/static/chunks/952-88eca4c7fd0b58ee.js', revision: '88eca4c7fd0b58ee' },
        { url: '/_next/static/chunks/9664-e1b5f38aed9724bb.js', revision: 'e1b5f38aed9724bb' },
        { url: '/_next/static/chunks/9795-b2d8b16604a0902f.js', revision: 'b2d8b16604a0902f' },
        { url: '/_next/static/chunks/9992-17b2dacb0d908767.js', revision: '17b2dacb0d908767' },
        { url: '/_next/static/chunks/9da6db1e.6207ef3845dc2914.js', revision: '6207ef3845dc2914' },
        {
          url: '/_next/static/chunks/app/(auth)/sign-in/%5B%5B...sign-in%5D%5D/page-119c26315d638c2f.js',
          revision: '119c26315d638c2f',
        },
        {
          url: '/_next/static/chunks/app/(auth)/sign-up/%5B%5B...sign-up%5D%5D/page-119c26315d638c2f.js',
          revision: '119c26315d638c2f',
        },
        {
          url: '/_next/static/chunks/app/(dashboard)/analytics/page-a28a32d3f52e417f.js',
          revision: 'a28a32d3f52e417f',
        },
        {
          url: '/_next/static/chunks/app/(dashboard)/animals/%5Bid%5D/page-ff12eb538a654408.js',
          revision: 'ff12eb538a654408',
        },
        {
          url: '/_next/static/chunks/app/(dashboard)/animals/new/page-b06c9b413ef3e114.js',
          revision: 'b06c9b413ef3e114',
        },
        {
          url: '/_next/static/chunks/app/(dashboard)/animals/page-3bdaebd7fdca353e.js',
          revision: '3bdaebd7fdca353e',
        },
        {
          url: '/_next/static/chunks/app/(dashboard)/assets/page-4e732e5c4ed96bcf.js',
          revision: '4e732e5c4ed96bcf',
        },
        {
          url: '/_next/static/chunks/app/(dashboard)/breeding/page-cbfb267d93f26366.js',
          revision: 'cbfb267d93f26366',
        },
        {
          url: '/_next/static/chunks/app/(dashboard)/dashboard/page-8f90d657e25a3949.js',
          revision: '8f90d657e25a3949',
        },
        {
          url: '/_next/static/chunks/app/(dashboard)/diseases/page-d7c6e1032f9cfa0c.js',
          revision: 'd7c6e1032f9cfa0c',
        },
        {
          url: '/_next/static/chunks/app/(dashboard)/error-f98f6530436bc6ef.js',
          revision: 'f98f6530436bc6ef',
        },
        {
          url: '/_next/static/chunks/app/(dashboard)/finance/page-18fdafe118deb550.js',
          revision: '18fdafe118deb550',
        },
        {
          url: '/_next/static/chunks/app/(dashboard)/health/page-3586a68640a9b74f.js',
          revision: '3586a68640a9b74f',
        },
        {
          url: '/_next/static/chunks/app/(dashboard)/help/page-03392633155d802a.js',
          revision: '03392633155d802a',
        },
        {
          url: '/_next/static/chunks/app/(dashboard)/layout-0c63478d220d3644.js',
          revision: '0c63478d220d3644',
        },
        {
          url: '/_next/static/chunks/app/(dashboard)/medicine/page-96c5f40cf130e834.js',
          revision: '96c5f40cf130e834',
        },
        {
          url: '/_next/static/chunks/app/(dashboard)/milk/new/page-851d31a65da3ff18.js',
          revision: '851d31a65da3ff18',
        },
        {
          url: '/_next/static/chunks/app/(dashboard)/milk/page-c6a4af5cd7b774d8.js',
          revision: 'c6a4af5cd7b774d8',
        },
        {
          url: '/_next/static/chunks/app/(dashboard)/monitoring/page-4a905ed58366e206.js',
          revision: '4a905ed58366e206',
        },
        {
          url: '/_next/static/chunks/app/(dashboard)/not-found-41e616300244e64d.js',
          revision: '41e616300244e64d',
        },
        {
          url: '/_next/static/chunks/app/(dashboard)/pricing/page-e808534e3fb3f079.js',
          revision: 'e808534e3fb3f079',
        },
        {
          url: '/_next/static/chunks/app/(dashboard)/reports/page-7d691d91db478acf.js',
          revision: '7d691d91db478acf',
        },
        {
          url: '/_next/static/chunks/app/(dashboard)/settings/custom-fields/page-2d4a28dd83369054.js',
          revision: '2d4a28dd83369054',
        },
        {
          url: '/_next/static/chunks/app/(dashboard)/settings/domain/page-3d1a80dd8bd54081.js',
          revision: '3d1a80dd8bd54081',
        },
        {
          url: '/_next/static/chunks/app/(dashboard)/settings/page-1d2b509c45d468db.js',
          revision: '1d2b509c45d468db',
        },
        {
          url: '/_next/static/chunks/app/(dashboard)/staff/page-e841739360482878.js',
          revision: 'e841739360482878',
        },
        {
          url: '/_next/static/chunks/app/(dashboard)/subscription/checkout/page-fc30b1047558ee79.js',
          revision: 'fc30b1047558ee79',
        },
        {
          url: '/_next/static/chunks/app/(dashboard)/subscription/page-421b26c3a058c796.js',
          revision: '421b26c3a058c796',
        },
        {
          url: '/_next/static/chunks/app/(onboarding)/onboarding/page-79b2e64862af5e2d.js',
          revision: '79b2e64862af5e2d',
        },
        {
          url: '/_next/static/chunks/app/(onboarding)/select-farm/page-dfc8882bb5762f4a.js',
          revision: 'dfc8882bb5762f4a',
        },
        {
          url: '/_next/static/chunks/app/(public)/apply/page-a92a39fab8bdcbe6.js',
          revision: 'a92a39fab8bdcbe6',
        },
        {
          url: '/_next/static/chunks/app/(public)/apply/status/page-6d33e5c601545c9a.js',
          revision: '6d33e5c601545c9a',
        },
        {
          url: '/_next/static/chunks/app/(public)/apply/success/page-60de8f81cfbb8afd.js',
          revision: '60de8f81cfbb8afd',
        },
        {
          url: '/_next/static/chunks/app/(public)/layout-79b2e64862af5e2d.js',
          revision: '79b2e64862af5e2d',
        },
        {
          url: '/_next/static/chunks/app/(super-admin)/admin/page-79b2e64862af5e2d.js',
          revision: '79b2e64862af5e2d',
        },
        {
          url: '/_next/static/chunks/app/(super-admin)/error-f1ce47434d508c0d.js',
          revision: 'f1ce47434d508c0d',
        },
        {
          url: '/_next/static/chunks/app/(super-admin)/layout-a16f14f7abc32bc9.js',
          revision: 'a16f14f7abc32bc9',
        },
        {
          url: '/_next/static/chunks/app/(super-admin)/not-found-92248f3275a730c0.js',
          revision: '92248f3275a730c0',
        },
        {
          url: '/_next/static/chunks/app/(super-admin)/payments/page-3e1c0f1e6297e706.js',
          revision: '3e1c0f1e6297e706',
        },
        {
          url: '/_next/static/chunks/app/(super-admin)/super-admin/analytics/page-96774d7dc2c78a54.js',
          revision: '96774d7dc2c78a54',
        },
        {
          url: '/_next/static/chunks/app/(super-admin)/super-admin/applications/page-cd17b70b5719a4c5.js',
          revision: 'cd17b70b5719a4c5',
        },
        {
          url: '/_next/static/chunks/app/(super-admin)/super-admin/farms/new/page-1df3700d7658a200.js',
          revision: '1df3700d7658a200',
        },
        {
          url: '/_next/static/chunks/app/(super-admin)/super-admin/farms/page-3a8ce9874f9b8db2.js',
          revision: '3a8ce9874f9b8db2',
        },
        {
          url: '/_next/static/chunks/app/(super-admin)/super-admin/migration/dashboard/page-a545c097efda1dda.js',
          revision: 'a545c097efda1dda',
        },
        {
          url: '/_next/static/chunks/app/(super-admin)/super-admin/notifications/page-b41387c5fc4c9d03.js',
          revision: 'b41387c5fc4c9d03',
        },
        {
          url: '/_next/static/chunks/app/(super-admin)/super-admin/page-804ab9205c41e2c0.js',
          revision: '804ab9205c41e2c0',
        },
        {
          url: '/_next/static/chunks/app/(super-admin)/super-admin/payments/page-135e3e99c52e8707.js',
          revision: '135e3e99c52e8707',
        },
        {
          url: '/_next/static/chunks/app/(super-admin)/super-admin/security/page-eda50e8e86cdbb03.js',
          revision: 'eda50e8e86cdbb03',
        },
        {
          url: '/_next/static/chunks/app/(super-admin)/super-admin/settings/page-a28e6c7a84cd939d.js',
          revision: 'a28e6c7a84cd939d',
        },
        {
          url: '/_next/static/chunks/app/(super-admin)/super-admin/users/page-487b50db06ea7a02.js',
          revision: '487b50db06ea7a02',
        },
        {
          url: '/_next/static/chunks/app/_not-found/page-79b2e64862af5e2d.js',
          revision: '79b2e64862af5e2d',
        },
        {
          url: '/_next/static/chunks/app/api/admin/applications/%5Bid%5D/review/route-79b2e64862af5e2d.js',
          revision: '79b2e64862af5e2d',
        },
        {
          url: '/_next/static/chunks/app/api/admin/applications/route-79b2e64862af5e2d.js',
          revision: '79b2e64862af5e2d',
        },
        {
          url: '/_next/static/chunks/app/api/admin/coupons/%5Bid%5D/route-79b2e64862af5e2d.js',
          revision: '79b2e64862af5e2d',
        },
        {
          url: '/_next/static/chunks/app/api/admin/coupons/route-79b2e64862af5e2d.js',
          revision: '79b2e64862af5e2d',
        },
        {
          url: '/_next/static/chunks/app/api/admin/farms/route-79b2e64862af5e2d.js',
          revision: '79b2e64862af5e2d',
        },
        {
          url: '/_next/static/chunks/app/api/admin/feature-flags/route-79b2e64862af5e2d.js',
          revision: '79b2e64862af5e2d',
        },
        {
          url: '/_next/static/chunks/app/api/admin/payments/route-79b2e64862af5e2d.js',
          revision: '79b2e64862af5e2d',
        },
        {
          url: '/_next/static/chunks/app/api/admin/payments/verify/route-79b2e64862af5e2d.js',
          revision: '79b2e64862af5e2d',
        },
        {
          url: '/_next/static/chunks/app/api/admin/stats/route-79b2e64862af5e2d.js',
          revision: '79b2e64862af5e2d',
        },
        {
          url: '/_next/static/chunks/app/api/admin/tenants/route-79b2e64862af5e2d.js',
          revision: '79b2e64862af5e2d',
        },
        {
          url: '/_next/static/chunks/app/api/admin/users/route-79b2e64862af5e2d.js',
          revision: '79b2e64862af5e2d',
        },
        {
          url: '/_next/static/chunks/app/api/ai/milk-prediction/route-79b2e64862af5e2d.js',
          revision: '79b2e64862af5e2d',
        },
        {
          url: '/_next/static/chunks/app/api/analytics/route-79b2e64862af5e2d.js',
          revision: '79b2e64862af5e2d',
        },
        {
          url: '/_next/static/chunks/app/api/animal-treatments/route-79b2e64862af5e2d.js',
          revision: '79b2e64862af5e2d',
        },
        {
          url: '/_next/static/chunks/app/api/animal-vaccinations/due/route-79b2e64862af5e2d.js',
          revision: '79b2e64862af5e2d',
        },
        {
          url: '/_next/static/chunks/app/api/animal-vaccinations/route-79b2e64862af5e2d.js',
          revision: '79b2e64862af5e2d',
        },
        {
          url: '/_next/static/chunks/app/api/animals/%5Bid%5D/route-79b2e64862af5e2d.js',
          revision: '79b2e64862af5e2d',
        },
        {
          url: '/_next/static/chunks/app/api/animals/batch-operations/route-79b2e64862af5e2d.js',
          revision: '79b2e64862af5e2d',
        },
        {
          url: '/_next/static/chunks/app/api/animals/count/route-79b2e64862af5e2d.js',
          revision: '79b2e64862af5e2d',
        },
        {
          url: '/_next/static/chunks/app/api/animals/enhanced/route-79b2e64862af5e2d.js',
          revision: '79b2e64862af5e2d',
        },
        {
          url: '/_next/static/chunks/app/api/animals/route-79b2e64862af5e2d.js',
          revision: '79b2e64862af5e2d',
        },
        {
          url: '/_next/static/chunks/app/api/animals/upload-photo/route-79b2e64862af5e2d.js',
          revision: '79b2e64862af5e2d',
        },
        {
          url: '/_next/static/chunks/app/api/api-keys/%5Bid%5D/route-79b2e64862af5e2d.js',
          revision: '79b2e64862af5e2d',
        },
        {
          url: '/_next/static/chunks/app/api/api-keys/route-79b2e64862af5e2d.js',
          revision: '79b2e64862af5e2d',
        },
        {
          url: '/_next/static/chunks/app/api/auth/redirect/route-79b2e64862af5e2d.js',
          revision: '79b2e64862af5e2d',
        },
        {
          url: '/_next/static/chunks/app/api/breeding/%5Bid%5D/route-79b2e64862af5e2d.js',
          revision: '79b2e64862af5e2d',
        },
        {
          url: '/_next/static/chunks/app/api/breeding/heat-alerts/route-79b2e64862af5e2d.js',
          revision: '79b2e64862af5e2d',
        },
        {
          url: '/_next/static/chunks/app/api/breeding/pregnancy-checks/route-79b2e64862af5e2d.js',
          revision: '79b2e64862af5e2d',
        },
        {
          url: '/_next/static/chunks/app/api/breeding/pregnant-animals/route-79b2e64862af5e2d.js',
          revision: '79b2e64862af5e2d',
        },
        {
          url: '/_next/static/chunks/app/api/breeding/route-79b2e64862af5e2d.js',
          revision: '79b2e64862af5e2d',
        },
        {
          url: '/_next/static/chunks/app/api/coupons/validate/route-79b2e64862af5e2d.js',
          revision: '79b2e64862af5e2d',
        },
        {
          url: '/_next/static/chunks/app/api/cron/predictions/route-79b2e64862af5e2d.js',
          revision: '79b2e64862af5e2d',
        },
        {
          url: '/_next/static/chunks/app/api/diseases/%5Bid%5D/route-79b2e64862af5e2d.js',
          revision: '79b2e64862af5e2d',
        },
        {
          url: '/_next/static/chunks/app/api/diseases/route-79b2e64862af5e2d.js',
          revision: '79b2e64862af5e2d',
        },
        {
          url: '/_next/static/chunks/app/api/eggs/route-79b2e64862af5e2d.js',
          revision: '79b2e64862af5e2d',
        },
        {
          url: '/_next/static/chunks/app/api/expenses/%5Bid%5D/route-79b2e64862af5e2d.js',
          revision: '79b2e64862af5e2d',
        },
        {
          url: '/_next/static/chunks/app/api/expenses/route-79b2e64862af5e2d.js',
          revision: '79b2e64862af5e2d',
        },
        {
          url: '/_next/static/chunks/app/api/farm-applications/%5Bid%5D/route-79b2e64862af5e2d.js',
          revision: '79b2e64862af5e2d',
        },
        {
          url: '/_next/static/chunks/app/api/farm-applications/my/route-79b2e64862af5e2d.js',
          revision: '79b2e64862af5e2d',
        },
        {
          url: '/_next/static/chunks/app/api/farm-applications/route-79b2e64862af5e2d.js',
          revision: '79b2e64862af5e2d',
        },
        {
          url: '/_next/static/chunks/app/api/feed-management/enhanced/route-79b2e64862af5e2d.js',
          revision: '79b2e64862af5e2d',
        },
        {
          url: '/_next/static/chunks/app/api/feed-management/inventory/route-79b2e64862af5e2d.js',
          revision: '79b2e64862af5e2d',
        },
        {
          url: '/_next/static/chunks/app/api/feed-management/schedules/route-79b2e64862af5e2d.js',
          revision: '79b2e64862af5e2d',
        },
        {
          url: '/_next/static/chunks/app/api/health/iot/route-79b2e64862af5e2d.js',
          revision: '79b2e64862af5e2d',
        },
        {
          url: '/_next/static/chunks/app/api/health/records/%5Bid%5D/route-79b2e64862af5e2d.js',
          revision: '79b2e64862af5e2d',
        },
        {
          url: '/_next/static/chunks/app/api/health/records/route-79b2e64862af5e2d.js',
          revision: '79b2e64862af5e2d',
        },
        {
          url: '/_next/static/chunks/app/api/health/route-79b2e64862af5e2d.js',
          revision: '79b2e64862af5e2d',
        },
        {
          url: '/_next/static/chunks/app/api/import/route-79b2e64862af5e2d.js',
          revision: '79b2e64862af5e2d',
        },
        {
          url: '/_next/static/chunks/app/api/invitations/%5BinviteId%5D/route-79b2e64862af5e2d.js',
          revision: '79b2e64862af5e2d',
        },
        {
          url: '/_next/static/chunks/app/api/invitations/send/route-79b2e64862af5e2d.js',
          revision: '79b2e64862af5e2d',
        },
        {
          url: '/_next/static/chunks/app/api/iot-management/devices/route-79b2e64862af5e2d.js',
          revision: '79b2e64862af5e2d',
        },
        {
          url: '/_next/static/chunks/app/api/iot-management/sensor-data/route-79b2e64862af5e2d.js',
          revision: '79b2e64862af5e2d',
        },
        {
          url: '/_next/static/chunks/app/api/iot-management/sensor-data/webhook/route-79b2e64862af5e2d.js',
          revision: '79b2e64862af5e2d',
        },
        {
          url: '/_next/static/chunks/app/api/iot/milk-log/route-79b2e64862af5e2d.js',
          revision: '79b2e64862af5e2d',
        },
        {
          url: '/_next/static/chunks/app/api/medicine-inventory/route-79b2e64862af5e2d.js',
          revision: '79b2e64862af5e2d',
        },
        {
          url: '/_next/static/chunks/app/api/medicine/route-79b2e64862af5e2d.js',
          revision: '79b2e64862af5e2d',
        },
        {
          url: '/_next/static/chunks/app/api/medicines/%5Bid%5D/route-79b2e64862af5e2d.js',
          revision: '79b2e64862af5e2d',
        },
        {
          url: '/_next/static/chunks/app/api/medicines/route-79b2e64862af5e2d.js',
          revision: '79b2e64862af5e2d',
        },
        {
          url: '/_next/static/chunks/app/api/migration/dashboard/route-79b2e64862af5e2d.js',
          revision: '79b2e64862af5e2d',
        },
        {
          url: '/_next/static/chunks/app/api/migration/recover/route-79b2e64862af5e2d.js',
          revision: '79b2e64862af5e2d',
        },
        {
          url: '/_next/static/chunks/app/api/migration/schedule/route-79b2e64862af5e2d.js',
          revision: '79b2e64862af5e2d',
        },
        {
          url: '/_next/static/chunks/app/api/milk-quality/tests/route-79b2e64862af5e2d.js',
          revision: '79b2e64862af5e2d',
        },
        {
          url: '/_next/static/chunks/app/api/milk/iot/route-79b2e64862af5e2d.js',
          revision: '79b2e64862af5e2d',
        },
        {
          url: '/_next/static/chunks/app/api/milk/route-79b2e64862af5e2d.js',
          revision: '79b2e64862af5e2d',
        },
        {
          url: '/_next/static/chunks/app/api/milk/stats/route-79b2e64862af5e2d.js',
          revision: '79b2e64862af5e2d',
        },
        {
          url: '/_next/static/chunks/app/api/organizations/create/route-79b2e64862af5e2d.js',
          revision: '79b2e64862af5e2d',
        },
        {
          url: '/_next/static/chunks/app/api/payments/bank-transfer/route-79b2e64862af5e2d.js',
          revision: '79b2e64862af5e2d',
        },
        {
          url: '/_next/static/chunks/app/api/payments/callback/%5Bgateway%5D/route-79b2e64862af5e2d.js',
          revision: '79b2e64862af5e2d',
        },
        {
          url: '/_next/static/chunks/app/api/payments/checkout/route-79b2e64862af5e2d.js',
          revision: '79b2e64862af5e2d',
        },
        {
          url: '/_next/static/chunks/app/api/payments/intent/route-79b2e64862af5e2d.js',
          revision: '79b2e64862af5e2d',
        },
        {
          url: '/_next/static/chunks/app/api/predictions/milk/route-79b2e64862af5e2d.js',
          revision: '79b2e64862af5e2d',
        },
        {
          url: '/_next/static/chunks/app/api/reports/generate/route-79b2e64862af5e2d.js',
          revision: '79b2e64862af5e2d',
        },
        {
          url: '/_next/static/chunks/app/api/sales/%5Bid%5D/route-79b2e64862af5e2d.js',
          revision: '79b2e64862af5e2d',
        },
        {
          url: '/_next/static/chunks/app/api/sales/route-79b2e64862af5e2d.js',
          revision: '79b2e64862af5e2d',
        },
        {
          url: '/_next/static/chunks/app/api/semen/route-79b2e64862af5e2d.js',
          revision: '79b2e64862af5e2d',
        },
        {
          url: '/_next/static/chunks/app/api/staff-management/attendance/route-79b2e64862af5e2d.js',
          revision: '79b2e64862af5e2d',
        },
        {
          url: '/_next/static/chunks/app/api/staff-management/tasks/route-79b2e64862af5e2d.js',
          revision: '79b2e64862af5e2d',
        },
        {
          url: '/_next/static/chunks/app/api/staff/%5BmemberId%5D/route-79b2e64862af5e2d.js',
          revision: '79b2e64862af5e2d',
        },
        {
          url: '/_next/static/chunks/app/api/staff/route-79b2e64862af5e2d.js',
          revision: '79b2e64862af5e2d',
        },
        {
          url: '/_next/static/chunks/app/api/subscription/route-79b2e64862af5e2d.js',
          revision: '79b2e64862af5e2d',
        },
        {
          url: '/_next/static/chunks/app/api/survey/nps/route-79b2e64862af5e2d.js',
          revision: '79b2e64862af5e2d',
        },
        {
          url: '/_next/static/chunks/app/api/system/health/route-79b2e64862af5e2d.js',
          revision: '79b2e64862af5e2d',
        },
        {
          url: '/_next/static/chunks/app/api/tenant/delete/route-79b2e64862af5e2d.js',
          revision: '79b2e64862af5e2d',
        },
        {
          url: '/_next/static/chunks/app/api/tenant/export/route-79b2e64862af5e2d.js',
          revision: '79b2e64862af5e2d',
        },
        {
          url: '/_next/static/chunks/app/api/tenants/check-subdomain/route-79b2e64862af5e2d.js',
          revision: '79b2e64862af5e2d',
        },
        {
          url: '/_next/static/chunks/app/api/tenants/config/route-79b2e64862af5e2d.js',
          revision: '79b2e64862af5e2d',
        },
        {
          url: '/_next/static/chunks/app/api/tenants/custom-fields/route-79b2e64862af5e2d.js',
          revision: '79b2e64862af5e2d',
        },
        {
          url: '/_next/static/chunks/app/api/tenants/initialize/route-79b2e64862af5e2d.js',
          revision: '79b2e64862af5e2d',
        },
        {
          url: '/_next/static/chunks/app/api/tenants/limits/route-79b2e64862af5e2d.js',
          revision: '79b2e64862af5e2d',
        },
        {
          url: '/_next/static/chunks/app/api/tenants/subscription/route-79b2e64862af5e2d.js',
          revision: '79b2e64862af5e2d',
        },
        {
          url: '/_next/static/chunks/app/api/treatment-protocols/route-79b2e64862af5e2d.js',
          revision: '79b2e64862af5e2d',
        },
        {
          url: '/_next/static/chunks/app/api/unsubscribe/route-79b2e64862af5e2d.js',
          revision: '79b2e64862af5e2d',
        },
        {
          url: '/_next/static/chunks/app/api/upload/route-79b2e64862af5e2d.js',
          revision: '79b2e64862af5e2d',
        },
        {
          url: '/_next/static/chunks/app/api/user/create-records/route-79b2e64862af5e2d.js',
          revision: '79b2e64862af5e2d',
        },
        {
          url: '/_next/static/chunks/app/api/user/email-preferences/route-79b2e64862af5e2d.js',
          revision: '79b2e64862af5e2d',
        },
        {
          url: '/_next/static/chunks/app/api/user/farms/route-79b2e64862af5e2d.js',
          revision: '79b2e64862af5e2d',
        },
        {
          url: '/_next/static/chunks/app/api/user/join-org/route-79b2e64862af5e2d.js',
          revision: '79b2e64862af5e2d',
        },
        {
          url: '/_next/static/chunks/app/api/user/permissions/route-79b2e64862af5e2d.js',
          revision: '79b2e64862af5e2d',
        },
        {
          url: '/_next/static/chunks/app/api/users/count/route-79b2e64862af5e2d.js',
          revision: '79b2e64862af5e2d',
        },
        {
          url: '/_next/static/chunks/app/api/v2/health/route-79b2e64862af5e2d.js',
          revision: '79b2e64862af5e2d',
        },
        {
          url: '/_next/static/chunks/app/api/v2/milk/route-79b2e64862af5e2d.js',
          revision: '79b2e64862af5e2d',
        },
        {
          url: '/_next/static/chunks/app/api/vaccination-schedules/route-79b2e64862af5e2d.js',
          revision: '79b2e64862af5e2d',
        },
        {
          url: '/_next/static/chunks/app/api/veterinary/diseases/route-79b2e64862af5e2d.js',
          revision: '79b2e64862af5e2d',
        },
        {
          url: '/_next/static/chunks/app/api/veterinary/treatments/route-79b2e64862af5e2d.js',
          revision: '79b2e64862af5e2d',
        },
        {
          url: '/_next/static/chunks/app/api/veterinary/vaccinations/route-79b2e64862af5e2d.js',
          revision: '79b2e64862af5e2d',
        },
        {
          url: '/_next/static/chunks/app/api/weather/route-79b2e64862af5e2d.js',
          revision: '79b2e64862af5e2d',
        },
        {
          url: '/_next/static/chunks/app/api/weather/sync/route-79b2e64862af5e2d.js',
          revision: '79b2e64862af5e2d',
        },
        {
          url: '/_next/static/chunks/app/api/webhooks/clerk/route-79b2e64862af5e2d.js',
          revision: '79b2e64862af5e2d',
        },
        { url: '/_next/static/chunks/app/error-fbfa1983cca2f5cc.js', revision: 'fbfa1983cca2f5cc' },
        {
          url: '/_next/static/chunks/app/farm/diseases-medicines/page-9ba53292587de8e0.js',
          revision: '9ba53292587de8e0',
        },
        {
          url: '/_next/static/chunks/app/invite/%5BinviteId%5D/page-702855d31c1bb579.js',
          revision: '702855d31c1bb579',
        },
        {
          url: '/_next/static/chunks/app/layout-64a4b9bc3c4ddf81.js',
          revision: '64a4b9bc3c4ddf81',
        },
        {
          url: '/_next/static/chunks/app/login/page-79b2e64862af5e2d.js',
          revision: '79b2e64862af5e2d',
        },
        {
          url: '/_next/static/chunks/app/not-found-8b76240d8fc835f0.js',
          revision: '8b76240d8fc835f0',
        },
        {
          url: '/_next/static/chunks/app/opengraph-image/route-79b2e64862af5e2d.js',
          revision: '79b2e64862af5e2d',
        },
        { url: '/_next/static/chunks/app/page-79b2e64862af5e2d.js', revision: '79b2e64862af5e2d' },
        {
          url: '/_next/static/chunks/app/robots.txt/route-79b2e64862af5e2d.js',
          revision: '79b2e64862af5e2d',
        },
        {
          url: '/_next/static/chunks/app/signup/page-79b2e64862af5e2d.js',
          revision: '79b2e64862af5e2d',
        },
        {
          url: '/_next/static/chunks/app/sitemap.xml/route-79b2e64862af5e2d.js',
          revision: '79b2e64862af5e2d',
        },
        {
          url: '/_next/static/chunks/app/unsubscribe/page-a933f0d3c576b046.js',
          revision: 'a933f0d3c576b046',
        },
        { url: '/_next/static/chunks/framework-b9fd9bcc3ecde907.js', revision: 'b9fd9bcc3ecde907' },
        { url: '/_next/static/chunks/main-97fc0907d366be2e.js', revision: '97fc0907d366be2e' },
        { url: '/_next/static/chunks/main-app-00153c4436a542de.js', revision: '00153c4436a542de' },
        {
          url: '/_next/static/chunks/pages/_app-e8b861c87f6f033c.js',
          revision: 'e8b861c87f6f033c',
        },
        {
          url: '/_next/static/chunks/pages/_error-c8f84f7bd11d43d4.js',
          revision: 'c8f84f7bd11d43d4',
        },
        {
          url: '/_next/static/chunks/polyfills-42372ed130431b0a.js',
          revision: '846118c33b2c0e922d7b3a7676f81f6f',
        },
        { url: '/_next/static/chunks/webpack-e9eb8ee5e061780c.js', revision: 'e9eb8ee5e061780c' },
        { url: '/_next/static/css/2932f5721ad95c0e.css', revision: '2932f5721ad95c0e' },
        { url: '/_next/static/css/391424db40f9486e.css', revision: '391424db40f9486e' },
        {
          url: '/_next/static/media/4cf2300e9c8272f7-s.p.woff2',
          revision: '18bae71b1e1b2bb25321090a3b563103',
        },
        {
          url: '/_next/static/media/50a22be602a0c7d8-s.woff2',
          revision: 'af12b060e1b1c092030a90c5c27fcead',
        },
        {
          url: '/_next/static/media/747892c23ea88013-s.woff2',
          revision: 'a0761690ccf4441ace5cec893b82d4ab',
        },
        {
          url: '/_next/static/media/8d697b304b401681-s.woff2',
          revision: 'cc728f6c0adb04da0dfcb0fc436a8ae5',
        },
        {
          url: '/_next/static/media/93f479601ee12b01-s.p.woff2',
          revision: 'da83d5f06d825c5ae65b7cca706cb312',
        },
        {
          url: '/_next/static/media/9610d9e46709d722-s.woff2',
          revision: '7b7c0ef93df188a852344fc272fc096b',
        },
        {
          url: '/_next/static/media/ba015fad6dcf6784-s.woff2',
          revision: '8ea4f719af3312a055caf09f34c89a77',
        },
        {
          url: '/_next/static/media/e142b3780bacc0a9-s.woff2',
          revision: '7da6404d714bd6d92248cb2673face86',
        },
        {
          url: '/_next/static/media/ed873e0918d65364-s.p.woff2',
          revision: 'ff1b2c110f980c9ac10ad53e27b8a271',
        },
        {
          url: '/_next/static/xbtCw5EFnfJAcKa-c-XrR/_buildManifest.js',
          revision: '253685888a75f2a17c8caa90143b5406',
        },
        {
          url: '/_next/static/xbtCw5EFnfJAcKa-c-XrR/_ssgManifest.js',
          revision: 'b6652df95db52feb4daf4eca35380933',
        },
        { url: '/api-test.html', revision: '2711207a6c9c3e2afb4ca461e551f4e5' },
        { url: '/debug.html', revision: '72a889391a75fd6497c3a17a3d34e06f' },
        { url: '/file.svg', revision: 'd09f95206c3fa0bb9bd9fefabfd0ea71' },
        { url: '/globe.svg', revision: '2aaafa6a49b6563925fe440891e32717' },
        { url: '/icons/icon-192.svg', revision: 'ae52b489d7cb94c83e4dc7f94c79739b' },
        { url: '/icons/icon-512.svg', revision: '748ffbb846ea01449c0765968c361cbe' },
        { url: '/manifest.json', revision: '9b8282b3d0a55376562249b254a0904e' },
        { url: '/next.svg', revision: '8e061864f388b47f33a1c3780831193e' },
        { url: '/offline.html', revision: '5cf17b5ab1712c45b5e2ca83310e83e5' },
        { url: '/sw.backup.js', revision: '72d06cb3e1588bca778431f258ce5a58' },
        { url: '/vercel.svg', revision: 'c0af2f507b369b085b35ef4bbe3bcf1e' },
        { url: '/window.svg', revision: 'a2760511c65806022ad20adf74370ff3' },
      ],
      { ignoreURLParametersMatching: [] }
    ),
    e.cleanupOutdatedCaches(),
    e.registerRoute(
      '/',
      new e.NetworkFirst({
        cacheName: 'start-url',
        plugins: [
          {
            cacheWillUpdate: async ({ request: e, response: a, event: s, state: i }) =>
              a && 'opaqueredirect' === a.type
                ? new Response(a.body, { status: 200, statusText: 'OK', headers: a.headers })
                : a,
          },
        ],
      }),
      'GET'
    ),
    e.registerRoute(
      /^https?.+\/api\/(animals|milk|health)/,
      new e.NetworkFirst({
        cacheName: 'mtk-api-cache',
        networkTimeoutSeconds: 10,
        plugins: [new e.ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 86400 })],
      }),
      'GET'
    ));
});
