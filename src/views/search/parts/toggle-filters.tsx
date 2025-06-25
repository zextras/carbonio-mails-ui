/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { Container, Switch, Text, Padding } from '@zextras/carbonio-design-system';
import { t } from '@zextras/carbonio-shell-ui';
import { Controller, useFormContext } from 'react-hook-form';

import { AdvancedFilterModalFormValues } from 'views/search/types/types';

export const ToggleFilters = (): React.JSX.Element => {
	const { control } = useFormContext<AdvancedFilterModalFormValues>();
	return (
		<>
			<Container orientation="horizontal" mainAlignment="center" crossAlignment="center">
				<Container padding={{ all: 'extrasmall' }}>
					<Container orientation="horizontal" mainAlignment="flex-start" crossAlignment="center">
						<Padding right="small">
							<Controller
								control={control}
								name={'hasAttachment'}
								render={({ field: { onChange, value } }): React.JSX.Element => (
									<Switch
										data-testid="hasAttachmentToggle"
										onClick={(): void => onChange(!value)}
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
								name={'isFlagged'}
								render={({ field: { onChange, value } }): React.JSX.Element => (
									<Switch
										data-testid="isFlaggedToggle"
										onClick={(): void => onChange(!value)}
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
								name={'isUnread'}
								render={({ field: { onChange, value } }): React.JSX.Element => (
									<Switch
										data-testid="isUnreadToggle"
										onClick={(): void => onChange(!value)}
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
								name={'isSharedFolderIncluded'}
								render={({ field: { onChange, value } }): React.JSX.Element => (
									<Switch
										data-testid="isSharedFolderIncludedToggle"
										onClick={(): void => onChange(!value)}
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
