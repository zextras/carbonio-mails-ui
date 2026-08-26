/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { MAILS_ROUTE } from 'constants/index';

/**
 * Matches the folder route of the mails module within a location pathname.
 *
 * The match is not anchored to the beginning of the pathname because the shell is
 * served under a base path (e.g. /carbonio/mails/folder/2), which is not part of
 * the pathname seen by the router
 */
const MAILS_FOLDER_PATHNAME_REGEX = new RegExp(`(?:^|/)${MAILS_ROUTE}/folder/([^/?#]+)`);

/**
 * Returns the id of the folder currently displayed by the mails module, extracted
 * from the given location pathname.
 *
 * It is meant for the code which runs outside the module's router (e.g. the actions
 * registered on the shell) and therefore cannot rely on the route params hooks.
 *
 * @param pathname the location pathname to analyze
 *
 * @returns the folder id or undefined if the pathname doesn't point to a mails folder
 */
export const getFolderIdFromPathname = (pathname: string): string | undefined =>
	MAILS_FOLDER_PATHNAME_REGEX.exec(pathname)?.[1];
