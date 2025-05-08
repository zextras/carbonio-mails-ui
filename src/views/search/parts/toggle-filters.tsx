/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, ReactElement } from 'react';

import { Container, Switch, Text, Padding } from '@zextras/carbonio-design-system';
import { t } from '@zextras/carbonio-shell-ui';
import { Controller } from 'react-hook-form';

import type { ToggleFiltersProps } from '../../../types';

const ToggleFilters: FC<ToggleFiltersProps> = ({
	control,
	query,
	isSharedFolderIncludedToggleName,
	isFlaggedToggleName,
	hasAttachmentToggleName,
	isUnreadToggleName
}): ReactElement => {
	const hasAttachment = query.some((item) => item.label === 'has:attachment');
	const isUnread = query.some((item) => item.label === 'is:unread');
	const isFlagged = query.some((item) => item.label === 'is:flagged');
	return (
		<>
			<Container orientation="horizontal" mainAlignment="center" crossAlignment="center">
				<Container padding={{ all: 'extrasmall' }}>
					<Container orientation="horizontal" mainAlignment="flex-start" crossAlignment="center">
						<Padding right="small">
							<Controller
								control={control}
								defaultValue={hasAttachment}
								name={hasAttachmentToggleName}
								render={({ field: { onChange, value } }) => (
									<Switch
										data-testid="hasAttachmentToggle"
										onClick={() => onChange(!value)}
										value={value}
									/>
								)}
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
							<Controller
								control={control}
								defaultValue={isFlagged}
								name={isFlaggedToggleName}
								render={({ field: { onChange, value } }) => (
									<Switch
										data-testid="isFlaggedToggle"
										onClick={() => onChange(!value)}
										value={value}
									/>
								)}
							/>
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
							<Controller
								control={control}
								name={isUnreadToggleName}
								defaultValue={isUnread}
								render={({ field: { onChange, value } }) => (
									<Switch
										data-testid="isUnreadToggle"
										onClick={() => onChange(!value)}
										value={value}
									/>
								)}
							/>
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
							<Controller
								control={control}
								name={isSharedFolderIncludedToggleName}
								render={({ field: { onChange, value } }) => (
									<Switch
										data-testid="isSharedFolderIncludedToggle"
										onClick={() => onChange(!value)}
										value={value}
									/>
								)}
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
