/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useCallback } from 'react';

import { Text, Button, FormSubSection, Padding } from '@zextras/carbonio-design-system';
import { t } from '@zextras/carbonio-shell-ui';

import { recoverMessagesSubSection } from './subsections';

export const RecoverMessages = (): React.JSX.Element => {
	const restoreMessages = useCallback(() => {
		fetch('/zx/backup/v1/undelete?start=2024-04-08T00:00:00Z&end=2024-04-12T00:00:00Z', {
			method: 'POST',
			credentials: 'same-origin'
		});
	}, []);
	const informativeText = `You can still retrieve emails deleted from Trash within the past 7 days.
By clicking “START RECOVERY will initiate the process to retrieve the mails. Once process is completed you will receive a notification in your Inbox and a new folder will be created.`;

	const buttonLabel = t('label.start_recovery', 'Start Recovery');

	const sectionTitle = recoverMessagesSubSection();

	return (
		<FormSubSection id={sectionTitle.id} label={sectionTitle.label} padding={{ all: 'medium' }}>
			<Padding top="large" />
			<Text>{informativeText}</Text>
			<Padding top="large" />
			<Button type={'outlined'} onClick={restoreMessages} label={buttonLabel} />
		</FormSubSection>
	);
};
