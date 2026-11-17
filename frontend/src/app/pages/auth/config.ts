export enum EAuthPageMode {
  login,
  register,
  forgot,
  reset,
}

export const AUTH_PAGE_TITLES = {
  [EAuthPageMode.login]: 'Welcome back.',
  [EAuthPageMode.register]: 'Join your team.',
  [EAuthPageMode.forgot]: 'Let’s get you back in.',
  [EAuthPageMode.reset]: 'A fresh start.',
} satisfies Record<EAuthPageMode, string>;

export const AUTH_PAGE_DESCRIPTIONS = {
  [EAuthPageMode.login]: 'Sign in to your workspace.',
  [EAuthPageMode.register]:
    'Use the email address your invitation was sent to.',
  [EAuthPageMode.forgot]: 'We’ll send you a link to reset your password.',
  [EAuthPageMode.reset]: 'Choose a new password for your account.',
} satisfies Record<EAuthPageMode, string>;

export const AUTH_PAGE_BUTTON_LABELS = {
  [EAuthPageMode.login]: 'Sign in',
  [EAuthPageMode.register]: 'Create account',
  [EAuthPageMode.forgot]: 'Send reset link',
  [EAuthPageMode.reset]: 'Update password',
} satisfies Record<EAuthPageMode, string>;
