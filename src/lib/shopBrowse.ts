export interface ShopBrowseState {
  searchQuery: string;
  category: string;
  featuredOnly: boolean;
  wishlistOnly: boolean;
  sort: string;
  page: number;
  scrollY: number;
}

export interface ShopReturnLocation {
  pathname: "/";
  search: string;
  state: { shopBrowse: ShopBrowseState };
}

export function shopReturnLocation(search: string, shopBrowse: ShopBrowseState): ShopReturnLocation {
  return { pathname: "/", search, state: { shopBrowse } };
}