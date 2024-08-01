/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, useEffect } from 'react';

import { updatePrimaryBadge } from '@zextras/carbonio-shell-ui';

import { useSyncDataHandler } from './commons/sync-data-handler-hooks';
import { FOLDERS } from '../../carbonio-ui-commons/constants/folders';
import { useFolder } from '../../carbonio-ui-commons/store/zustand/folder';
import { MAILS_ROUTE } from '../../constants';

const InboxBadgeUpdater = (): null => {
	const inbox = useFolder(FOLDERS.INBOX);
	useEffect(() => {
		if (inbox)
			updatePrimaryBadge(
				{
					show: !!inbox.u,
					count: inbox.u,
					showCount: true
				},
				MAILS_ROUTE
			);
	}, [inbox]);
	return null;
};

export const SyncDataHandler: FC = () => {
	useSyncDataHandler();
	return <InboxBadgeUpdater />;
};
