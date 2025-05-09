/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useState, useCallback, useMemo, useEffect, useId } from 'react';

import { CustomModal, ModalHeader, Divider, ModalFooter } from '@zextras/carbonio-design-system';
import { t } from '@zextras/carbonio-shell-ui';
import { concat } from 'lodash';
import moment from 'moment';
import { FormProvider, useForm } from 'react-hook-form';

import { AttachmentTypeEmailStatusRow } from './parts/attachment-type-email-status-row';
import { ReceivedSentAddressRow } from './parts/received-sent-address-row';
import { SendReceivedDateRow } from './parts/send-date-row';
import { SubjectKeywordRow } from './parts/subject-keyword-row';
import { TagFolderRow } from './parts/tag-folder-row';
import { ToggleFilters } from './parts/toggle-filters';
import { ContactInputItem } from '../../carbonio-ui-commons/integrations/types';
import { ScrollableContainer } from '../../commons/scrollable-container';
import { KeywordState, Query } from '../../types';
import { SizeLargerSizeSmallerRow } from './parts/size-smaller-size-larger-row';

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

type FormValues = {
	['keyword-input']: KeywordState;
	['subject-input']: KeywordState;
	['has-attachment']: boolean;
	['is-flagged']: boolean;
	['is-unread']: boolean;
	['sent-before']: Date | null;
	['sent-after']: Date | null;
	['sent-on']: Date | null;
	['size-smaller']: KeywordState;
	['size-larger']: KeywordState;
	['received-from']: Array<ContactInputItem>;
	['sent-to']: Array<ContactInputItem>;
	['attachment-type']: KeywordState;
	['email-status']: KeywordState;
	['tag-input']: KeywordState;
	['folder-input']: KeywordState;
};

export const AdvancedFilterModal = ({
	open,
	onClose,
	query,
	isSharedFolderIncludedInitialValue,
	onSearchConfirm,
	includeSharedItemsInSearchPref
}: AdvancedFilterModalProps): React.JSX.Element => {
	const [isSharedFolderIncluded, setIsSharedFolderIncluded] = useState(
		isSharedFolderIncludedInitialValue
	);
	const methods = useForm<FormValues>();
	const { watch, setValue } = methods;

	const keywordInput = watch('keyword-input', []);
	const subjectInput = watch('subject-input');
	const hasAttachment = watch('has-attachment');
	const isFlagged = watch('is-flagged');
	const isUnread = watch('is-unread');
	const sentBefore = watch('sent-before');
	const sentAfter = watch('sent-after');
	const sentOn = watch('sent-on');
	const sizeSmaller = watch('size-smaller');
	const sizeLarger = watch('size-larger');
	const receivedFrom = watch('received-from', []);
	const sentTo = watch('sent-to', []);
	const attachmentType = watch('attachment-type');
	const emailStatus = watch('email-status');
	const tag = watch('tag-input', []);
	const folder = watch('folder-input', []);

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
		setValue('size-smaller', []);
		setValue('size-larger', []);
		setValue('received-from', []);
		setValue('sent-to', []);
		setValue('attachment-type', []);
		setValue('email-status', []);
	}, [setValue]);

	useEffect(() => {
		setIsSharedFolderIncluded(isSharedFolderIncludedInitialValue);
	}, [isSharedFolderIncludedInitialValue]);

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
					id: '',
					label: `from:${item.value.email}`,
					value: `from:${item.value.email}`,
					avatarBackground: item.background,
					error: false
				})),
				sentTo.map((item) => ({
					...item,
					label: `to:${item.value.email}`,
					value: `to:${item.value.email}`,
					avatarBackground: item.background,
					error: false,
					id: ''
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

	if (!open) return <></>;

	return (
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
				<FormProvider {...methods}>
					<ToggleFilters
						query={query}
						isSharedFolderIncludedToggleName={'is-shared-folder-included'}
						hasAttachmentToggleName={'has-attachment'}
						isFlaggedToggleName={'is-flagged'}
						isUnreadToggleName={'is-unread'}
					/>
					<SubjectKeywordRow
						query={query}
						keywordsInputName={'keyword-input'}
						subjectInputName={'subject-input'}
					/>
					<ReceivedSentAddressRow
						query={query}
						receivedFromInputName={'received-from'}
						sentToInputName={'sent-to'}
					/>
					<AttachmentTypeEmailStatusRow
						query={query}
						attachmentTypeInputName={'attachment-type'}
						emailStatusInputName={'email-status'}
					/>
					<SizeLargerSizeSmallerRow
						query={query}
						sizeLargerInputName={'size-larger'}
						sizeSmallerInputName={'size-smaller'}
					/>
					<SendReceivedDateRow
						query={query}
						sentBeforeInputName={'sent-before'}
						sentAfterInputName={'sent-after'}
						sentOnInputName={'sent-on'}
					/>
					<TagFolderRow query={query} tagInputName={'tag-input'} folderInputName={'folder-input'} />
				</FormProvider>
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
	);
};
