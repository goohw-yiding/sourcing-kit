import { NextResponse } from "next/server";

export async function GET() {
  const assetLinks = [
    {
      relation: ["delegate_permission/common.handle_all_urls"],
      target: {
        namespace: "android_app",
        package_name: "kr.sourcingkit.app",
        sha256_cert_fingerprints: [
          "A1:53:99:6C:E2:58:D8:BF:0A:3D:3F:B0:68:99:02:4C:55:A7:E2:56:1E:5B:D2:B0:22:70:F1:5D:C7:3C:F8:4A",
        ],
      },
    },
  ];
  return NextResponse.json(assetLinks);
}
