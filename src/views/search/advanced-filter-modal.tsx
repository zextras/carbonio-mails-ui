/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useState, useCallback, useMemo, useEffect, useId } from 'react';

import {
	CustomModal,
	Icon,
	Row,
	Padding,
	ModalHeader,
	Divider,
	ModalFooter,
	Tooltip,
	Text,
	ChipItem
} from '@zextras/carbonio-design-system';
import { t } from '@zextras/carbonio-shell-ui';
import { concat, filter, map } from 'lodash';
import moment from 'moment';
import { useForm } from 'react-hook-form';

import AttachmentTypeEmailStatusRow from './parts/attachment-type-email-status-row';
import { ReceivedSentAddressRow } from './parts/received-sent-address-row';
import SendReceivedDateRow from './parts/send-date-row';
import SizeSmallerSizeLargerRow from './parts/size-smaller-size-larger-row';
import SubjectKeywordRow from './parts/subject-keyword-row';
import TagFolderRow from './parts/tag-folder-row';
import ToggleFilters from './parts/toggle-filters';
import { ZIMBRA_STANDARD_COLORS } from '../../carbonio-ui-commons/constants';
import { ContactInputItem } from '../../carbonio-ui-commons/integrations/types';
import { getTags } from '../../carbonio-ui-commons/store/zustand/tags';
import { ScrollableContainer } from '../../commons/scrollable-container';
import { KeywordState, Query } from '../../types';

export type AdvancedFilterModalProps = {
	open: boolean;
	onClose: () => void;
	query: Query;
	isSharedFolderIncludedInitialValue: boolean;
	onSearchConfirm: (request: { query: Query; includeSharedFolders: boolean }) => void;
	includeSharedItemsInSearchPref: boolean;
};

const QUERY_DATE_FORMAT = 'L';

function dateToKeywordState({
	id,
	prefix,
	date
}: {
	id: string;
	prefix: string;
	date: Date | null;
}): KeywordState {
	if (date === null) {
		return [];
	}
	const value = `${prefix}:${moment(date).format(QUERY_DATE_FORMAT)}`;
	return [
		{
			id,
			hasAvatar: true,
			avatarBackground: 'gray1',
			label: value,
			value,
			isQueryFilter: true,
			avatarIcon: 'CalendarOutline'
		}
	];
}

export const AdvancedFilterModal = ({
	open,
	onClose,
	query,
	isSharedFolderIncludedInitialValue,
	onSearchConfirm,
	includeSharedItemsInSearchPref
}: AdvancedFilterModalProps): React.JSX.Element => {
	const [folder, setFolder] = useState<KeywordState>([]);
	const [isSharedFolderIncluded, setIsSharedFolderIncluded] = useState(
		isSharedFolderIncludedInitialValue
	);
	const { control, setValue, watch } = useForm();
	const keywordInput: Array<ChipItem> = watch('keyword-input', []);
	const subjectInput: Array<ChipItem> = watch('subject-input');
	const hasAttachment: boolean = watch('has-attachment');
	const isFlagged: boolean = watch('is-flagged');
	const isUnread: boolean = watch('is-unread');
	const sentBefore: Date | null = watch('sent-before');
	const sentAfter: Date | null = watch('sent-after');
	const sentOn: Date | null = watch('sent-on');
	const sizeSmaller = watch('size-smaller');
	const sizeLarger = watch('size-larger');
	const receivedFrom: Array<ContactInputItem> = watch('received-from', []);
	const sentTo: Array<ContactInputItem> = watch('sent-to', []);
	const attachmentType = watch('attachment-type');
	const emailStatus = watch('email-status');

	const queryArray = useMemo(() => ['has:attachment', 'is:flagged', 'is:unread'], []);
	const tagOptions = useMemo(
		() =>
			map(getTags(), (item) => ({
				...item,
				label: item.name,
				customComponent: (
					<Row takeAvailableSpace mainAlignment="flex-start">
						<Row takeAvailableSpace mainAlignment="space-between">
							<Row mainAlignment="flex-end">
								<Padding right="small">
									<Icon icon="Tag" color={ZIMBRA_STANDARD_COLORS[item.color ?? 0].hex} />
								</Padding>
							</Row>
							<Row takeAvailableSpace mainAlignment="flex-start">
								<Tooltip label={item.name} overflowTooltip>
									<Text>{item.name}</Text>
								</Tooltip>
							</Row>
						</Row>
					</Row>
				)
			})),
		[]
	);
	const [tag, setTag] = useState<KeywordState>([]);
	const id = useId();

	const resetFilters = useCallback(() => {
		setValue('keyword-input', []);
		setValue('subject-input', []);
		setValue('has-attachment', false);
		setValue('is-flagged', false);
		setValue('is-unread', false);
		setValue('sent-before', null);
		setValue('sent-after', null);
		setValue('sent-on', null);
		setValue('size-smaller', undefined);
		setValue('size-larger', undefined);
		setValue('received-from', []);
		setValue('sent-to', []);
		setValue('attachment-type', undefined);
		setValue('email-status', undefined);
	}, [setValue]);

	useEffect(() => {
		setIsSharedFolderIncluded(isSharedFolderIncludedInitialValue);
	}, [isSharedFolderIncludedInitialValue]);

	useEffect(() => {
		const tagInQuery = map(
			filter(query, (v) => /^tag:/.test(v.label)),
			(q) => ({ ...q, hasAvatar: true, icon: 'TagOutline' })
		);
		setTag(tagInQuery);

		const folderInQuery = map(
			filter(query, (v) => /^in:/.test(v.label)),
			(q) => ({
				...q,
				hasAvatar: true,
				icon: 'FolderOutline'
			})
		);

		setFolder(folderInQuery);
	}, [open, query, queryArray]);

	const queryToBe = useMemo<Query>(
		() =>
			concat(
				keywordInput,
				subjectInput,
				isUnread
					? [
							{
								id: `${id}--is:unread`,
								label: 'is:unread',
								value: 'is:unread',
								isQueryFilter: true,
								avatarIcon: 'EmailOutline',
								avatarBackground: 'gray1'
							}
						]
					: [],
				isFlagged
					? [
							{
								id: `${id}--is:flagged`,
								label: 'is:flagged',
								value: 'is:flagged',
								isQueryFilter: true,
								avatarIcon: 'FlagOutline',
								avatarBackground: 'error'
							}
						]
					: [],
				hasAttachment
					? [
							{
								id: `${id}--has:attachment`,
								label: 'has:attachment',
								value: 'has:attachment',
								isQueryFilter: true,
								avatarIcon: 'AttachOutline',
								avatarBackground: 'gray1'
							}
						]
					: [],
				folder,
				dateToKeywordState({ id: `${id}--before`, prefix: 'before', date: sentBefore }),
				dateToKeywordState({ id: `${id}--after`, prefix: 'after', date: sentAfter }),
				dateToKeywordState({ id: `${id}--date`, prefix: 'date', date: sentOn }),
				tag,
				attachmentType,
				emailStatus,
				sizeLarger,
				sizeSmaller,
				receivedFrom.map((item) => ({
					...item,
					label: `from:${item.value.email}`,
					value: `from:${item.value.email}`
				})),
				sentTo.map((item) => ({
					...item,
					label: `to:${item.value.email}`,
					value: `to:${item.value.email}`
				}))
			),
		[
			keywordInput,
			subjectInput,
			isUnread,
			id,
			isFlagged,
			hasAttachment,
			folder,
			sentBefore,
			sentAfter,
			sentOn,
			tag,
			attachmentType,
			emailStatus,
			sizeLarger,
			sizeSmaller,
			receivedFrom,
			sentTo
		]
	);

	const onConfirm = useCallback(() => {
		const controller = new AbortController();
		try {
			onSearchConfirm({ query: queryToBe, includeSharedFolders: isSharedFolderIncluded });
			onClose();
		} catch (error) {
			controller.abort();
		}
		return () => {
			controller.abort();
		};
	}, [onSearchConfirm, queryToBe, isSharedFolderIncluded, onClose]);

	const tagFolderRowProps = useMemo(
		() => ({ folder, setFolder, tagOptions, tag, setTag }),
		[folder, tagOptions, tag]
	);

	return (
		<>
			{open ? (
				<CustomModal open={open} onClose={onClose} maxHeight="90vh" size="medium">
					<ModalHeader
						onClose={onClose}
						title={t('label.single_advanced_filter', 'Advanced Filters')}
						showCloseIcon
					/>
					<Divider />

					<ScrollableContainer
						padding={{ horizontal: 'medium', vertical: 'small' }}
						mainAlignment={'flex-start'}
					>
						<ToggleFilters
							query={query}
							control={control}
							isSharedFolderIncludedToggleName={'is-shared-folder-included'}
							hasAttachmentToggleName={'has-attachment'}
							isFlaggedToggleName={'is-flagged'}
							isUnreadToggleName={'is-unread'}
						/>
						<SubjectKeywordRow
							query={query}
							control={control}
							keywordsInputName={'keyword-input'}
							subjectInputName={'subject-input'}
						/>
						<ReceivedSentAddressRow
							query={query}
							control={control}
							receivedFromInputName={'received-from'}
							sentToInputName={'sent-to'}
						/>
						<AttachmentTypeEmailStatusRow
							query={query}
							control={control}
							attachmentTypeInputName={'attachment-type'}
							emailStatusInputName={'email-status'}
						/>
						<SizeSmallerSizeLargerRow
							query={query}
							control={control}
							sizeLargerInputName={'size-larger'}
							sizeSmallerInputName={'size-smaller'}
						/>
						<SendReceivedDateRow
							control={control}
							query={query}
							sentBeforeInputName={'sent-before'}
							sentAfterInputName={'sent-after'}
							sentOnInputName={'sent-on'}
						/>
						<TagFolderRow compProps={tagFolderRowProps} />
					</ScrollableContainer>
					<Divider />
					<ModalFooter
						onConfirm={onConfirm}
						confirmDisabled={queryToBe.length === 0}
						secondaryActionDisabled={
							queryToBe.length === 0 && isSharedFolderIncluded === includeSharedItemsInSearchPref
						}
						confirmLabel={t('action.search', 'Search')}
						secondaryActionLabel={t('action.reset', 'Reset filters')}
						onSecondaryAction={resetFilters}
					/>
				</CustomModal>
			) : (
				<></>
			)}{' '}
		</>
	);
};
