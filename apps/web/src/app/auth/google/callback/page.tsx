import GoogleCallbackClient from "./GoogleCallbackClient";

type CallbackPageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

function readSingleQueryValue(value: string | string[] | undefined) {
  if (typeof value === "string") {
    return value;
  }
  if (Array.isArray(value) && value.length > 0) {
    return value[0];
  }
  return null;
}

export default function GoogleCallbackPage({ searchParams }: CallbackPageProps) {
  const code = readSingleQueryValue(searchParams?.code);
  const state = readSingleQueryValue(searchParams?.state);
  const oauthError = readSingleQueryValue(searchParams?.error);
  const oauthErrorDescription = readSingleQueryValue(searchParams?.error_description);

  const normalizedOAuthError = oauthError
    ? `Google 로그인에 실패했습니다. ${oauthErrorDescription ?? oauthError}`
    : null;

  return <GoogleCallbackClient code={code} state={state} oauthError={normalizedOAuthError} />;
}
