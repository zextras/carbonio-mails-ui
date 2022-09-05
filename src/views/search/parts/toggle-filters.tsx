/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { nanoid } from '@reduxjs/toolkit';
import React, { useCallback, useState, useEffect, FC, ReactElement } from 'react';
import { Container, Switch, Text, Padding, ChipProps } from '@zextras/carbonio-design-system';
import { filter } from 'lodash';
import { QueryChip, t } from '@zextras/carbonio-shell-ui';

type ToggleFilters = Array<{
	id: string;
	avatarIcon?: string;
	label: string;
	value: string;
	isQueryFilter?: boolean;
	isGeneric?: boolean;
	avatarBackground?: ChipProps['background'];
}>;
type ToggleFiltersProps = {
	compProps: {
		query: Array<QueryChip>;
		setUnreadFilter: (arg: ToggleFilters) => void;
		setFlaggedFilter: (arg: ToggleFilters) => void;
		setAttachmentFilter: (arg: ToggleFilters) => void;
		isSharedFolderIncludedTobe: boolean;
		setIsSharedFolderIncludedTobe: (arg: boolean) => void;
	};
};

const ToggleFilters: FC<ToggleFiltersProps> = ({ compProps }): ReactElement => {
	const {
		query,
		setUnreadFilter,
		setFlaggedFilter,
		setAttachmentFilter,
		isSharedFolderIncludedTobe,
		setIsSharedFolderIncludedTobe
	} = compProps;

	const [isUnread, setIsUnread] = useState(false);
	const [hasAttachment, setHasAttachment] = useState(false);
	const [isFlagged, setIsFlagged] = useState(false);

	const toggleUnread = useCallback(() => {
		setIsUnread(!isUnread);
		isUnread
			? setUnreadFilter([])
			: setUnreadFilter([
					{
						id: nanoid(),
						label: 'is:unread',
						value: 'is:unread',
						isQueryFilter: true,
						avatarIcon: 'EmailOutline',
						avatarBackground: 'gray1'
					}
			  ]);
	}, [isUnread, setUnreadFilter]);

	const toggleFlagged = useCallback(() => {
		setIsFlagged(!isFlagged);
		isFlagged
			? setFlaggedFilter([])
			: setFlaggedFilter([
					{
						id: nanoid(),
						label: 'is:flagged',
						value: 'is:flagged',
						isQueryFilter: true,
						avatarIcon: 'FlagOutline',
						avatarBackground: 'error'
					}
			  ]);
	}, [isFlagged, setFlaggedFilter]);

	const toggleAttachment = useCallback(() => {
		setHasAttachment(!hasAttachment);
		hasAttachment
			? setAttachmentFilter([])
			: setAttachmentFilter([
					{
						id: nanoid(),
						label: 'has:attachment',
						value: 'has:attachment',
						isQueryFilter: true,
						avatarIcon: 'AttachOutline',
						avatarBackground: 'gray1'
					}
			  ]);
	}, [hasAttachment, setAttachmentFilter]);

	const toggleSharedFolder = useCallback(() => {
		setIsSharedFolderIncludedTobe(!isSharedFolderIncludedTobe);
	}, [isSharedFolderIncludedTobe, setIsSharedFolderIncludedTobe]);

	useEffect(() => {
		if (filter(query, (q) => q.value === 'is:unread' || q.label === 'is:unread').length === 0) {
			setIsUnread(false);
			setUnreadFilter([]);
		} else {
			setIsUnread(true);
			setUnreadFilter([
				{
					id: nanoid(),
					label: 'is:unread',
					value: 'is:unread',
					isQueryFilter: true,
					isGeneric: false
				}
			]);
		}

		if (filter(query, (q) => q.value === 'is:flagged' || q.label === 'is:flagged').length === 0) {
			setIsFlagged(false);
			setFlaggedFilter([]);
		} else {
			setIsFlagged(true);
			setFlaggedFilter([
				{
					id: nanoid(),
					label: 'is:flagged',
					value: 'is:flagged',
					isQueryFilter: true,
					isGeneric: false,
					avatarIcon: 'FlagOutline',
					avatarBackground: 'error'
				}
			]);
		}

		if (
			filter(query, (q) => q.value === 'has:attachment' || q.label === 'has:attachment').length ===
			0
		) {
			setHasAttachment(false);
			setAttachmentFilter([]);
		} else {
			setHasAttachment(true);
			setAttachmentFilter([
				{
					id: nanoid(),
					label: 'has:attachment',
					value: 'has:attachment',
					isQueryFilter: true,
					isGeneric: false
				}
			]);
		}
	}, [query, setAttachmentFilter, setFlaggedFilter, setUnreadFilter]);

	return (
		<>
			<Container orientation="horizontal" mainAlignment="center" crossAlignment="center">
				<Container padding={{ all: 'extrasmall' }}>
					<Container orientation="horizontal" mainAlignment="baseline" crossAlignment="center">
						<Padding right="small">
							<Switch onClick={toggleAttachment} value={hasAttachment} />
						</Padding>
						<Text size="large" weight="bold">
							{t('label.attachment', 'Attachment')}
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
					<Container orientation="horizontal" mainAlignment="baseline" crossAlignment="center">
						<Padding right="small">
							<Switch onClick={toggleFlagged} value={isFlagged} />
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
					<Container orientation="horizontal" mainAlignment="baseline" crossAlignment="center">
						<Padding right="small">
							<Switch onClick={toggleUnread} value={isUnread} />
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
					<Container orientation="horizontal" mainAlignment="baseline" crossAlignment="center">
						<Padding right="small">
							<Switch onClick={toggleSharedFolder} value={isSharedFolderIncludedTobe} />
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
