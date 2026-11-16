/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { useEffect, useState } from 'react';

import { FOLDER_VIEW, useInitializeFolders } from '@zextras/carbonio-ui-commons';

import { MailboxRefreshedEvent } from 'event-bus/events/mailbox-refreshed';
import { useEventSubscribe } from 'event-bus/use-event-subscribe';

const FoldersInitializer = (): null => {
	useInitializeFolders(FOLDER_VIEW.message);
	return null;
};

export const InitializeFolders = (): React.JSX.Element => {
	// useInitializeFolders fetches the folders only when mounted, so it is remounted to reload them
	const [generation, setGeneration] = useState(0);
	const subscribeBusEvent = useEventSubscribe();

	useEffect(
		() =>
			subscribeBusEvent(MailboxRefreshedEvent.EventName, () => {
				setGeneration((current) => current + 1);
			}),
		[subscribeBusEvent]
	);

	return <FoldersInitializer key={generation} />;
};
