/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useCallback, FC, ReactElement } from 'react';

import { Container, Switch, Text, Padding } from '@zextras/carbonio-design-system';
import { t } from '@zextras/carbonio-shell-ui';

import type { ToggleFiltersProps } from '../../../types';

const ToggleFilters: FC<ToggleFiltersProps> = ({ compProps }): ReactElement => {
	const {
		isUnread,
		isFlagged,
		hasAttachment,
		setIsUnread,
		setIsFlagged,
		setHasAttachment,
		isSharedFolderIncludedTobe,
		setIsSharedFolderIncludedTobe
	} = compProps;

	const toggleUnread = useCallback(() => {
		setIsUnread(!isUnread);
	}, [isUnread, setIsUnread]);

	const toggleFlagged = useCallback(() => {
		setIsFlagged(!isFlagged);
	}, [isFlagged, setIsFlagged]);

	const toggleAttachment = useCallback(() => {
		setHasAttachment(!hasAttachment);
	}, [hasAttachment, setHasAttachment]);

	const toggleSharedFolder = useCallback(() => {
		setIsSharedFolderIncludedTobe(!isSharedFolderIncludedTobe);
	}, [isSharedFolderIncludedTobe, setIsSharedFolderIncludedTobe]);

	return (
		<>
			<Container orientation="horizontal" mainAlignment="center" crossAlignment="center">
				<Container padding={{ all: 'extrasmall' }}>
					<Container orientation="horizontal" mainAlignment="flex-start" crossAlignment="center">
						<Padding right="small">
							<Switch
								data-testid="hasAttachmentToggle"
								onClick={toggleAttachment}
								value={hasAttachment}
							/>
						</Padding>
						<Text size="large" weight="bold">
							{t('label.advancedFilters.attachment', 'Attachment')}
						</Text>
					</Container>
					<Padding bottom="small" />
					<Text color="secondary" size="small" overflow="break-word">
						{t('search.attachment_note', 'Search for all e-mails that have an attachment.')}
					</Text>
				</Container>
				<Container
					padding={{ all: 'extrasmall' }}
					mainAlignment="flex-start"
					crossAlignment="flex-start"
				>
					<Container orientation="horizontal" mainAlignment="flex-start" crossAlignment="center">
						<Padding right="small">
							<Switch data-testid="isFlaggedToggle" onClick={toggleFlagged} value={isFlagged} />
						</Padding>
						<Text size="large" weight="bold">
							{t('label.flagged', 'Flagged')}
						</Text>
					</Container>
					<Padding bottom="small" />
					<Text color="secondary" size="small" overflow="break-word">
						{t('search.flagged_note', 'Search for all flagged e-mails.')}
					</Text>
					<Padding bottom="small" />
				</Container>
			</Container>

			<Container orientation="horizontal" mainAlignment="center" crossAlignment="center">
				<Container
					padding={{ all: 'extrasmall' }}
					mainAlignment="flex-start"
					crossAlignment="flex-start"
				>
					<Container orientation="horizontal" mainAlignment="flex-start" crossAlignment="center">
						<Padding right="small">
							<Switch data-testid="isUnreadToggle" onClick={toggleUnread} value={isUnread} />
						</Padding>
						<Text size="large" weight="bold">
							{t('search.unread', 'Unread')}
						</Text>
					</Container>
					<Padding bottom="small" />
					<Text color="secondary" size="small" overflow="break-word">
						{t('search.unread_note', 'Search for all unread e-mail items.')}
					</Text>
					<Padding bottom="small" />
				</Container>
				<Container
					padding={{ all: 'extrasmall' }}
					mainAlignment="flex-start"
					crossAlignment="flex-start"
				>
					<Container orientation="horizontal" mainAlignment="flex-start" crossAlignment="center">
						<Padding right="small">
							<Switch
								data-testid="isSharedFolderIncludedToggle"
								onClick={toggleSharedFolder}
								value={isSharedFolderIncludedTobe}
							/>
						</Padding>
						<Text size="large" weight="bold">
							{t('label.include_shared_folders', 'Include Shared Folders')}
						</Text>
					</Container>
					<Padding bottom="small" />
					<Text color="secondary" size="small" overflow="break-word">
						{t('search.shared_folders_note', 'Search inside shared folders.')}
					</Text>
					<Padding bottom="small" />
				</Container>
			</Container>
		</>
	);
};

export default ToggleFilters;
