import { loggedInSelector } from "#/features/auth/authSelectors";
import { activeMastodonAccountSelector } from "#/features/auth/mastodon/mastodonAuthSlice";
import MastodonFollowingList from "#/features/mastodon/following/MastodonFollowingList";
import { useAppSelector } from "#/store";

import GuestCommunitiesList from "./GuestCommunitiesList";
import LoggedInCommunitiesList from "./LoggedInCommunitiesList";

export interface CommunitiesListProps {
  actor: string;
}

export default function CommunitiesList(props: CommunitiesListProps) {
  const loggedIn = useAppSelector(loggedInSelector);
  const activeMastodonAccount = useAppSelector(activeMastodonAccountSelector);

  // Show Mastodon following list when Mastodon account is active
  if (activeMastodonAccount) {
    return <MastodonFollowingList />;
  }

  const List = loggedIn ? LoggedInCommunitiesList : GuestCommunitiesList;

  return <List {...props} />;
}
