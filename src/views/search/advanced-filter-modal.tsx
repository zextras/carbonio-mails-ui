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
	Text
} from '@zextras/carbonio-design-system';
import { t } from '@zextras/carbonio-shell-ui';
import { concat, filter, map, reject } from 'lodash';
import moment from 'moment';
import { useForm } from 'react-hook-form';

import AttachmentTypeEmailStatusRow from './parts/attachment-type-email-status-row';
import { ReceivedSentAddressRow } from './parts/received-sent-address-row';
import SendReceivedDateRow from './parts/send-date-row';
import SizeSmallerSizeLargerRow from './parts/size-smaller-size-larger-row';
import SubjectKeywordRow from './parts/subject-keyword-row';
import TagFolderRow from './parts/tag-folder-row';
import ToggleFilters from './parts/toggle-filters';
import { getChipItems } from './utils';
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

function toDate(prefix: string, query: Query): Date | null {
	const prefixColon = `${prefix}:`;
	const dateQuery = map(
		filter(query, (v) => v.label.startsWith(prefixColon)),
		(q) => q.label.substring(prefixColon.length)
	);
	if (dateQuery.length === 0) {
		return null;
	}
	return moment(dateQuery[0]).toDate();
}

export const AdvancedFilterModal = ({
	open,
	onClose,
	query,
	isSharedFolderIncludedInitialValue,
	onSearchConfirm,
	includeSharedItemsInSearchPref
}: AdvancedFilterModalProps): React.JSX.Element => {
	const [hasAttachment, setHasAttachment] = useState<boolean>(false);
	const [isUnread, setIsUnread] = useState<boolean>(false);
	const [isFlagged, setIsFlagged] = useState<boolean>(false);

	const [receivedFromAddresses, setReceivedFromAddresses] = useState<KeywordState>([]);
	const [sentToAddresses, setSentToAddresses] = useState<KeywordState>([]);
	const [folder, setFolder] = useState<KeywordState>([]);
	const [sentBefore, setSentBefore] = useState<Date | null>(null);
	const [sentOn, setSentOn] = useState<Date | null>(null);
	const [sentAfter, setSentAfter] = useState<Date | null>(null);
	const [attachmentType, setAttachmentType] = useState<KeywordState>([]);
	const [emailStatus, setEmailStatus] = useState<KeywordState>([]);
	const [sizeSmaller, setSizeSmaller] = useState<KeywordState>([]);
	const [sizeLarger, setSizeLarger] = useState<KeywordState>([]);
	const [sizeSmallerErrorLabel, setSizeSmallerErrorLabel] = useState('');
	const [sizeLargerErrorLabel, setSizeLargerErrorLabel] = useState('');
	const [isSharedFolderIncluded, setIsSharedFolderIncluded] = useState(
		isSharedFolderIncludedInitialValue
	);
	const { control, watch } = useForm();
	const keywordInput = watch('keyword-input');
	const subjectInput = watch('subject-input');
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
		// TODO: reset other keywords
		setHasAttachment(false);
		setIsFlagged(false);
		setIsUnread(false);
		// TODO: reset subject
		setAttachmentType([]);
		setEmailStatus([]);
		setSizeSmaller([]);
		setSizeLarger([]);
		setSizeSmallerErrorLabel('');
		setSizeLargerErrorLabel('');
		setReceivedFromAddresses([]);
		setSentToAddresses([]);
		setFolder([]);
		setTag([]);
		setSentBefore(null);
		setSentAfter(null);
		setSentOn(null);
		setIsSharedFolderIncluded(includeSharedItemsInSearchPref);
	}, [includeSharedItemsInSearchPref]);

	useEffect(() => {
		setIsSharedFolderIncluded(isSharedFolderIncludedInitialValue);
	}, [isSharedFolderIncludedInitialValue]);

	useEffect(() => {
		setHasAttachment(query.some((item) => item.label === 'has:attachment'));
		setIsUnread(query.some((item) => item.label === 'is:unread'));
		setIsFlagged(query.some((item) => item.label === 'is:flagged'));
		const attachmentTypeInQuery = map(
			filter(query, (v) => /^Attachment:/.test(v.label)),
			(q) => ({ ...q })
		);
		setAttachmentType(attachmentTypeInQuery);

		const emailStatusInQuery = map(
			filter(query, (v) => /^Is:/.test(v.label)),
			(q) => ({ ...q })
		);
		setEmailStatus(emailStatusInQuery);

		const sizeSmallerInQuery = map(
			filter(query, (v) => /^Smaller:/.test(v.label)),
			(q) => ({ ...q })
		);
		setSizeSmaller(sizeSmallerInQuery);

		const sizeLargerInQuery = map(
			filter(query, (v) => /^Larger:/.test(v.label)),
			(q) => ({ ...q })
		);
		setSizeLarger(sizeLargerInQuery);

		setSentBefore(toDate('before', query));
		setSentAfter(toDate('after', query));
		setSentOn(toDate('date', query));

		const tagInQuery = map(
			filter(query, (v) => /^tag:/.test(v.label)),
			(q) => ({ ...q, hasAvatar: true, icon: 'TagOutline' })
		);
		setTag(tagInQuery);

		const sentToInQuery = getChipItems(
			query.filter((queryItem) => /^to:*/.test(queryItem.label)),
			'to'
		);
		setSentToAddresses(sentToInQuery);

		const receivedFromInQuery = getChipItems(
			query.filter((queryItem) => /^from:*/.test(queryItem.label)),
			'from'
		);
		setReceivedFromAddresses(receivedFromInQuery);

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
				map(subjectInput, (q) => ({
					...q,
					hasAvatar: true,
					icon: 'EmailOutline',
					iconBackground: 'gray1'
				})),
				attachmentType,
				emailStatus,
				sizeLarger,
				sizeSmaller,
				receivedFromAddresses.map((x) => x),
				sentToAddresses
			),
		[
			keywordInput,
			isUnread,
			id,
			isFlagged,
			hasAttachment,
			folder,
			sentBefore,
			sentAfter,
			sentOn,
			tag,
			subjectInput,
			attachmentType,
			emailStatus,
			sizeLarger,
			sizeSmaller,
			receivedFromAddresses,
			sentToAddresses
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

	const handleReceivedFromInput = (values: Array<ContactInputItem>): void => {
		const newValues = values.map((val) => ({
			id: val.id ?? val.value.email,
			label: `from:${val.label}`,
			value: `from:${val.value.email}`,
			actions: reject(val?.actions, ['icon', 'EditOutline'])
		}));
		setReceivedFromAddresses(newValues);
	};

	// TODO: search chip have actions but they don't work except remove
	const handleSentToInput = (values: Array<ContactInputItem>): void => {
		const newValues = values.map((val) => ({
			id: val.id ?? val.value.email,
			label: `to:${val.label}`,
			value: `to:${val.value.email}`,
			actions: reject(val?.actions, ['icon', 'EditOutline'])
		}));
		setSentToAddresses(newValues);
	};

	// FIXME: how can a value of a query be undefined?
	const receivedSentAddressRowProps = useMemo(
		() => ({
			receivedFromAddresses: receivedFromAddresses.map((val) => ({
				email: val.value?.replace('from:', '') ?? ''
			})),
			handleReceivedFromInput,
			sentToAddresses: sentToAddresses.map((val) => ({
				email: val.value?.replace('to:', '') ?? ''
			})),
			handleSentToInput
		}),
		[receivedFromAddresses, sentToAddresses]
	);

	const attachmentTypeEmailStatusRowProps = useMemo(
		() => ({
			attachmentType,
			setAttachmentType,
			emailStatus,
			setEmailStatus
		}),
		[attachmentType, emailStatus]
	);

	const sizeSmallerSizeLargerRowProps = useMemo(
		() => ({
			t,
			sizeSmaller,
			setSizeSmaller,
			sizeLarger,
			setSizeLarger,
			sizeSmallerErrorLabel,
			setSizeSmallerErrorLabel,
			sizeLargerErrorLabel,
			setSizeLargerErrorLabel
		}),
		[sizeSmaller, sizeLarger, sizeSmallerErrorLabel, sizeLargerErrorLabel]
	);

	const tagFolderRowProps = useMemo(
		() => ({ folder, setFolder, tagOptions, tag, setTag }),
		[folder, tagOptions, tag]
	);

	const sendDateRowProps = useMemo(
		() => ({ sentBefore, setSentBefore, sentAfter, setSentAfter, sentOn, setSentOn }),
		[sentBefore, sentAfter, sentOn]
	);

	const toggleFiltersProps = useMemo(
		() => ({
			isUnread,
			isFlagged,
			hasAttachment,
			setIsUnread,
			setIsFlagged,
			setHasAttachment,
			setIsSharedFolderIncludedTobe: setIsSharedFolderIncluded,
			isSharedFolderIncludedTobe: isSharedFolderIncluded
		}),
		[isSharedFolderIncluded, isUnread, isFlagged, hasAttachment]
	);

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
				<ToggleFilters compProps={toggleFiltersProps} />
				<SubjectKeywordRow
					query={query}
					control={control}
					keywordsInputName={'keyword-input'}
					subjectInputName={'subject-input'}
				/>
				<ReceivedSentAddressRow compProps={receivedSentAddressRowProps} />
				<AttachmentTypeEmailStatusRow compProps={attachmentTypeEmailStatusRowProps} />
				<SizeSmallerSizeLargerRow compProps={sizeSmallerSizeLargerRowProps} />
				<SendReceivedDateRow compProps={sendDateRowProps} />
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
	);
};
