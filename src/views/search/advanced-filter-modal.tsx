/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useState, useCallback, useMemo, useEffect } from 'react';

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
import { QueryChip, t } from '@zextras/carbonio-shell-ui';
import { concat, filter, includes, map, reject } from 'lodash';

import AttachmentTypeEmailStatusRow from './parts/attachment-type-email-status-row';
import { ReceivedSentAddressRow } from './parts/received-sent-address-row';
import SendReceivedDateRow from './parts/send-date-row';
import SizeSmallerSizeLargerRow from './parts/size-smaller-size-larger-row';
import SubjectKeywordRow from './parts/subject-keyword-row';
import TagFolderRow from './parts/tag-folder-row';
import ToggleFilters from './parts/toggle-filters';
import { useDisabled, useSecondaryDisabled } from './parts/use-disable-hooks';
import { getChipItems } from './utils';
import { ZIMBRA_STANDARD_COLORS } from '../../carbonio-ui-commons/constants/utils';
import { ContactInputItem } from '../../carbonio-ui-commons/integrations/types';
import { getTags } from '../../carbonio-ui-commons/store/zustand/tags';
import { ScrollableContainer } from '../../commons/scrollable-container';
import { AdvancedFilterModalProps, KeywordState } from '../../types';

export const AdvancedFilterModal = ({
	open,
	onClose,
	query,
	updateQuery,
	setIsSharedFolderIncluded,
	isSharedFolderIncluded
}: AdvancedFilterModalProps): React.JSX.Element => {
	const [otherKeywords, setOtherKeywords] = useState<KeywordState>([]);
	const [attachmentFilter, setAttachmentFilter] = useState<KeywordState>([]);
	const [unreadFilter, setUnreadFilter] = useState<KeywordState>([]);
	const [flaggedFilter, setFlaggedFilter] = useState<KeywordState>([]);

	const [receivedFromAddresses, setReceivedFromAddresses] = useState<KeywordState>([]);
	const [sentToAddresses, setSentToAddresses] = useState<KeywordState>([]);
	const [folder, setFolder] = useState<KeywordState>([]);
	const [sentBefore, setSentBefore] = useState<KeywordState>([]);
	const [sentOn, setSentOn] = useState<KeywordState>([]);
	const [sentAfter, setSentAfter] = useState<KeywordState>([]);
	const [subject, setSubject] = useState<KeywordState>([]);
	const [attachmentType, setAttachmentType] = useState<KeywordState>([]);
	const [emailStatus, setEmailStatus] = useState<KeywordState>([]);
	const [sizeSmaller, setSizeSmaller] = useState<KeywordState>([]);
	const [sizeLarger, setSizeLarger] = useState<KeywordState>([]);
	const [sizeSmallerErrorLabel, setSizeSmallerErrorLabel] = useState('');
	const [sizeLargerErrorLabel, setSizeLargerErrorLabel] = useState('');
	const [isSharedFolderIncludedTobe, setIsSharedFolderIncludedTobe] =
		useState(isSharedFolderIncluded);
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

	useEffect(() => {
		const updatedQuery = map(
			filter(
				query,
				(v) =>
					!includes(queryArray, v.label) &&
					!/^Subject:/.test(v.label) &&
					!/^Attachment:/.test(v.label) &&
					!/^Is:/.test(v.label) &&
					!/^Smaller:/.test(v.label) &&
					!/^Larger:/.test(v.label) &&
					!/^subject:/.test(v.label) &&
					!/^in:/.test(v.label) &&
					!/^before:/.test(v.label) &&
					!/^after:/.test(v.label) &&
					!/^date:/.test(v.label) &&
					!/^tag:/.test(v.label) &&
					!/^to:/.test(v.label) &&
					!/^from:/.test(v.label) &&
					!v.isQueryFilter
			),
			(q) => ({ ...q, hasAvatar: false })
		);

		const subjectsInQuery = map(
			filter(query, (v) => /^Subject:/.test(v.label)),
			(q) => ({ ...q, hasAvatar: false })
		);
		setSubject(subjectsInQuery);

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
		const sentBeforeInQuery = map(
			filter(query, (v) => /^before:/.test(v.label)),
			(q) => ({ ...q, hasAvatar: true, icon: 'CalendarOutline' })
		);
		setSentBefore(sentBeforeInQuery);

		const sentAfterInQuery = map(
			filter(query, (v) => /^after:/.test(v.label)),
			(q) => ({ ...q, hasAvatar: true, icon: 'CalendarOutline' })
		);
		setSentAfter(sentAfterInQuery);

		const tagInQuery = map(
			filter(query, (v) => /^tag:/.test(v.label)),
			(q) => ({ ...q, hasAvatar: true, icon: 'TagOutline' })
		);
		setTag(tagInQuery);

		const sentOnInQuery = map(
			filter(query, (v) => /^date:/.test(v.label)),
			(q) => ({ ...q, hasAvatar: true, icon: 'CalendarOutline' })
		);
		setSentOn(sentOnInQuery);

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

		setOtherKeywords(updatedQuery);
	}, [query, queryArray]);

	const totalKeywords = useMemo(
		() => filter(otherKeywords, (q) => q.isGeneric === true || q.isQueryFilter === true).length,
		[otherKeywords]
	);

	const secondaryDisabled = useSecondaryDisabled({
		attachmentFilter,
		attachmentType,
		emailStatus,
		flaggedFilter,
		folder,
		receivedFromAddress: receivedFromAddresses,
		sentAfter,
		sentBefore,
		sentFromAddress: sentToAddresses,
		sentOn,
		sizeLarger,
		sizeSmaller,
		subject,
		tag,
		totalKeywords,
		unreadFilter
	});

	const resetFilters = useCallback(() => {
		setOtherKeywords([]);
		setAttachmentFilter([]);
		setSubject([]);
		setAttachmentType([]);
		setEmailStatus([]);
		setSizeSmaller([]);
		setSizeLarger([]);
		setSizeSmallerErrorLabel('');
		setSizeLargerErrorLabel('');
		updateQuery([]);
		setReceivedFromAddresses([]);
		setSentToAddresses([]);
		setFolder([]);
		setTag([]);
	}, [updateQuery]);

	const queryToBe = useMemo<Array<QueryChip>>(
		() =>
			concat(
				otherKeywords,
				unreadFilter,
				flaggedFilter,
				attachmentFilter,
				folder,
				sentBefore,
				sentAfter,
				sentOn,
				tag,
				map(subject, (q) => ({
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
			attachmentFilter,
			attachmentType,
			emailStatus,
			flaggedFilter,
			folder,
			otherKeywords,
			receivedFromAddresses,
			sentAfter,
			sentBefore,
			sentToAddresses,
			sentOn,
			sizeLarger,
			sizeSmaller,
			subject,
			tag,
			unreadFilter
		]
	);

	const onConfirm = useCallback(() => {
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		updateQuery(queryToBe);
		setIsSharedFolderIncluded(isSharedFolderIncludedTobe);
		onClose();
	}, [updateQuery, queryToBe, setIsSharedFolderIncluded, isSharedFolderIncludedTobe, onClose]);

	const subjectKeywordRowProps = useMemo(
		() => ({
			otherKeywords,
			setOtherKeywords,
			subject,
			setSubject
		}),
		[otherKeywords, subject]
	);

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
		[attachmentType, setAttachmentType, emailStatus, setEmailStatus]
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
		[
			sizeSmaller,
			setSizeSmaller,
			sizeLarger,
			setSizeLarger,
			sizeSmallerErrorLabel,
			setSizeSmallerErrorLabel,
			sizeLargerErrorLabel,
			setSizeLargerErrorLabel
		]
	);

	const tagFolderRowProps = useMemo(
		() => ({ folder, setFolder, tagOptions, tag, setTag }),
		[folder, setFolder, tagOptions, tag, setTag]
	);

	const sendDateRowProps = useMemo(
		() => ({ sentBefore, setSentBefore, sentAfter, setSentAfter, sentOn, setSentOn }),
		[sentBefore, setSentBefore, sentAfter, setSentAfter, sentOn, setSentOn]
	);
	const toggleFiltersProps = useMemo(
		() => ({
			query,
			setUnreadFilter,
			setFlaggedFilter,
			setAttachmentFilter,
			setIsSharedFolderIncludedTobe,
			isSharedFolderIncludedTobe
		}),
		[query, isSharedFolderIncludedTobe]
	);

	const disabled = useDisabled({
		query,
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		queryToBe,
		isSharedFolderIncluded,
		isSharedFolderIncludedTobe
	});

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
				<SubjectKeywordRow compProps={subjectKeywordRowProps} />
				<ReceivedSentAddressRow compProps={receivedSentAddressRowProps} />
				<AttachmentTypeEmailStatusRow compProps={attachmentTypeEmailStatusRowProps} />
				<SizeSmallerSizeLargerRow compProps={sizeSmallerSizeLargerRowProps} />
				<SendReceivedDateRow compProps={sendDateRowProps} />
				<TagFolderRow compProps={tagFolderRowProps} />
			</ScrollableContainer>
			<Divider />
			<ModalFooter
				onConfirm={onConfirm}
				confirmDisabled={disabled}
				secondaryActionDisabled={secondaryDisabled}
				confirmLabel={t('action.search', 'Search')}
				secondaryActionLabel={t('action.reset', 'Reset')}
				onSecondaryAction={resetFilters}
			/>
		</CustomModal>
	);
};
