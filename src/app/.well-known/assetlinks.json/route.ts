import { NextResponse } from "next/server";

export async function GET() {
  // sha256_cert_fingerprints will be filled in later when APK is generated
  const assetLinks = [
    {
      relation: ["delegate_permission/common.handle_all_urls"],
      target: {
        namespace: "android_app",
        package_name: "kr.sourcing_kit.app",
        sha256_cert_fingerprints: ["PLACEHOLDER_SHA256_FINGERPRINT"],
      },
    },
  ];
  return NextResponse.json(assetLinks);
}
