/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useCallback } from 'react';

import { useNavigate } from 'react-router-dom';

import { MAILS_ROUTE, SEARCH_ROUTE } from 'constants/index';
import { useInSearchModule } from 'ui-actions/utils';

/**
 * Returns a function that closes the preview panel, going back to the list the user came from:
 * the search results when in the search module, the folder otherwise.
 */
export const useClosePreviewPanel = (folderId?: string): (() => void) => {
	const isSearchContext = useInSearchModule();
	const navigate = useNavigate();

	return useCallback(
		() =>
			isSearchContext
				? navigate(`/${SEARCH_ROUTE}`, { replace: true })
				: navigate(`/${MAILS_ROUTE}/folder/${folderId}`, { replace: true }),
		[folderId, isSearchContext, navigate]
	);
};
