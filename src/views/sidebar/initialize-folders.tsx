/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { useEffect, useState } from 'react';

import { FOLDER_VIEW, useInitializeFolders } from '@zextras/carbonio-ui-commons';

import { MailboxRefreshedEvent } from 'event-bus/events/mailbox-refreshed';

const FoldersInitializer = (): null => {
	useInitializeFolders(FOLDER_VIEW.message);
	return null;
};

export const InitializeFolders = (): React.JSX.Element => {
	// useInitializeFolders fetches the folders only when mounted, so it is remounted to reload them
	const [generation, setGeneration] = useState(0);

	useEffect(() => {
		const handler = (): void => {
			setGeneration((current) => current + 1);
		};

		window.addEventListener(MailboxRefreshedEvent.EventName, handler);
		return () => {
			window.removeEventListener(MailboxRefreshedEvent.EventName, handler);
		};
	}, []);

	return <FoldersInitializer key={generation} />;
};
