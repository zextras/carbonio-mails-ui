/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useCallback, useEffect, FC, ReactElement, useId } from 'react';

import { Container, Switch, Text, Padding } from '@zextras/carbonio-design-system';
import { t } from '@zextras/carbonio-shell-ui';

import type { ToggleFiltersProps } from '../../../types';

const ToggleFilters: FC<ToggleFiltersProps> = ({ compProps }): ReactElement => {
	const {
		unreadFilter,
		flaggedFilter,
		attachmentFilter,
		setUnreadFilter,
		setFlaggedFilter,
		setAttachmentFilter,
		isSharedFolderIncludedTobe,
		setIsSharedFolderIncludedTobe
	} = compProps;

	const isUnread = unreadFilter.some((item) => item.value === 'is:unread');
	const isFlagged = flaggedFilter.some((item) => item.value === 'is:flagged');
	const hasAttachment = attachmentFilter.some((item) => item.value === 'has:attachment');
	const id = useId();

	const toggleUnread = useCallback(() => {
		isUnread
			? setUnreadFilter([])
			: setUnreadFilter([
					{
						id,
						label: 'is:unread',
						value: 'is:unread',
						isQueryFilter: true,
						avatarIcon: 'EmailOutline',
						avatarBackground: 'gray1'
					}
				]);
	}, [id, isUnread, setUnreadFilter]);

	const toggleFlagged = useCallback(() => {
		isFlagged
			? setFlaggedFilter([])
			: setFlaggedFilter([
					{
						id,
						label: 'is:flagged',
						value: 'is:flagged',
						isQueryFilter: true,
						avatarIcon: 'FlagOutline',
						avatarBackground: 'error'
					}
				]);
	}, [id, isFlagged, setFlaggedFilter]);

	const toggleAttachment = useCallback(() => {
		hasAttachment
			? setAttachmentFilter([])
			: setAttachmentFilter([
					{
						id,
						label: 'has:attachment',
						value: 'has:attachment',
						isQueryFilter: true,
						avatarIcon: 'AttachOutline',
						avatarBackground: 'gray1'
					}
				]);
	}, [hasAttachment, id, setAttachmentFilter]);

	const toggleSharedFolder = useCallback(() => {
		setIsSharedFolderIncludedTobe(!isSharedFolderIncludedTobe);
	}, [isSharedFolderIncludedTobe, setIsSharedFolderIncludedTobe]);

	useEffect(() => {
		if (!isUnread) {
			setUnreadFilter([]);
		} else {
			setUnreadFilter([
				{
					id,
					label: 'is:unread',
					value: 'is:unread',
					isQueryFilter: true,
					isGeneric: false
				}
			]);
		}

		if (!isFlagged) {
			setFlaggedFilter([]);
		} else {
			setFlaggedFilter([
				{
					id,
					label: 'is:flagged',
					value: 'is:flagged',
					isQueryFilter: true,
					isGeneric: false,
					avatarIcon: 'FlagOutline',
					avatarBackground: 'error'
				}
			]);
		}

		if (!hasAttachment) {
			setAttachmentFilter([]);
		} else {
			setAttachmentFilter([
				{
					id,
					label: 'has:attachment',
					value: 'has:attachment',
					isQueryFilter: true,
					isGeneric: false
				}
			]);
		}
	}, [
		id,
		isUnread,
		isFlagged,
		hasAttachment,
		setAttachmentFilter,
		setFlaggedFilter,
		setUnreadFilter
	]);

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
