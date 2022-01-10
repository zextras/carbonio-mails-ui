/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useCallback, useState, useEffect, FC, ReactElement } from 'react';
import { Container, Switch, Text, Padding } from '@zextras/zapp-ui';
import { filter } from 'lodash';
import { TFunction } from 'i18next';

type ToggleFiltersProps = {
	compProps: {
		t: TFunction;
		query: any;
		setUnreadFilter: (arg: any) => void;
		setFlaggedFilter: (arg: any) => void;
		setAttachmentFilter: (arg: any) => void;
	};
};

const ToggleFilters: FC<ToggleFiltersProps> = ({ compProps }): ReactElement => {
	const { t, query, setUnreadFilter, setFlaggedFilter, setAttachmentFilter } = compProps;

	const [isUnread, setIsUnread] = useState(false);
	const [hasAttachment, setHasAttachment] = useState(false);
	const [isFlagged, setIsFlagged] = useState(false);

	const toggleUnread = useCallback(() => {
		setIsUnread(!isUnread);
		isUnread
			? setUnreadFilter([])
			: setUnreadFilter([
					{
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
						label: 'has:attachment',
						value: 'has:attachment',
						isQueryFilter: true,
						avatarIcon: 'AttachOutline',
						avatarBackground: 'gray1'
					}
			  ]);
	}, [hasAttachment, setAttachmentFilter]);

	useEffect(() => {
		if (filter(query, (q) => q.value === 'is:unread' || q.label === 'is:unread').length === 0) {
			setIsUnread(false);
			setUnreadFilter([]);
		} else {
			setIsUnread(true);
			setUnreadFilter([
				{
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
				<Container padding={{ all: 'extrasmall' }}>
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
				</Container>
				<Container padding={{ all: 'extrasmall' }}>
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
						{t('search.unread_note', 'Search for all unread e-mail items.')} <br />
					</Text>
				</Container>
			</Container>
		</>
	);
};

export default ToggleFilters;
