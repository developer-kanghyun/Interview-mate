export type GoogleAuthUrlApiResponse = {
  success: boolean;
  data: {
    auth_url: string;
    state: string;
  };
};

export type GoogleAuthCallbackApiResponse = {
  success: boolean;
  data: {
    user_id: string;
    email: string;
    name: string;
    new_user: boolean;
  };
};

export type GuestAuthApiResponse = {
  success: boolean;
  data: {
    user_id: string;
    trial_question_limit: number;
  };
};

export type AuthMeApiResponse = {
  success: boolean;
  data: {
    user_id: string;
    email: string | null;
    name: string | null;
  };
};
