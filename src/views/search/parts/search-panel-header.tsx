/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, useCallback } from 'react';

import { useNavigate } from 'react-router-dom';

import { DetailPanelHeaderContent } from '../../../components/preview/detail-panel-header-content';
import { SEARCH_ROUTE } from '../../../constants';
import type { MailMessage, NormalizedConversation } from '../../../types';

export const SearchPanelHeader: FC<{
	item: NormalizedConversation | (Partial<MailMessage> & Pick<MailMessage, 'id'>);
}> = ({ item }) => {
	const navigate = useNavigate();
	const navigateToSearch = useCallback(() => {
		navigate(`/${SEARCH_ROUTE}`, { replace: true });
	}, [navigate]);

	return <DetailPanelHeaderContent onClose={navigateToSearch} {...item} />;
};
