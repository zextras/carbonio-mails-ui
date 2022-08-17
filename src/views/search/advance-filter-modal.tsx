/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, ReactElement, useState, useCallback, useMemo, useEffect } from 'react';
import {
	CustomModal,
	Container,
	Icon,
	Row,
	TextWithTooltip,
	Padding
} from '@zextras/carbonio-design-system';
import { TFunction } from 'i18next';
import { concat, filter, includes, map } from 'lodash';
import { getTags, QueryChip, ZIMBRA_STANDARD_COLORS } from '@zextras/carbonio-shell-ui';
import ModalFooter from '../sidebar/commons/modal-footer';
import ModalHeader from '../sidebar/commons/modal-header';
import ToggleFilters from './parts/toggle-filters';
import SubjectKeywordRow from './parts/subject-keyword-row';
import AttachmentTypeEmailStatusRow from './parts/attachment-type-email-status-row';
import SizeSmallerSizeLargerRow from './parts/size-smaller-size-larger-row';
import TagFolderRow from './parts/tag-folder-row';
import SendReceivedDateRow from './parts/send-date-row';
import { useDisabled, useSecondaryDisabled } from './parts/use-disable-hooks';
import ReceivedSentAddressRow from './parts/received-sent-address-row';
import { AdvancedFilterModalProps, KeywordState } from '../../types';

const AdvancedFilterModal: FC<AdvancedFilterModalProps> = ({
	open,
	onClose,
	t,
	query,
	updateQuery,
	setIsSharedFolderIncluded,
	isSharedFolderIncluded
}): ReactElement => {
	const [otherKeywords, setOtherKeywords] = useState<KeywordState>([]);
	const [attachmentFilter, setAttachmentFilter] = useState<KeywordState>([]);
	const [unreadFilter, setUnreadFilter] = useState<KeywordState>([]);
	const [flaggedFilter, setFlaggedFilter] = useState<KeywordState>([]);

	const [receivedFromAddress, setReceivedFromAddress] = useState<KeywordState>([]);
	const [sentFromAddress, setSentFromAddress] = useState<KeywordState>([]);
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
								<TextWithTooltip>{item.name}</TextWithTooltip>
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
					!v.isQueryFilter
			),
			(q) => ({ ...q, hasAvatar: false })
		);

		const subjectsFromQuery = map(
			filter(query, (v) => /^Subject:/.test(v.label)),
			(q) => ({ ...q, hasAvatar: false })
		);
		setSubject(subjectsFromQuery);

		const attachmentTypeFromQuery = map(
			filter(query, (v) => /^Attachment:/.test(v.label)),
			(q) => ({ ...q })
		);
		setAttachmentType(attachmentTypeFromQuery);

		const emailStatusFromQuery = map(
			filter(query, (v) => /^Is:/.test(v.label)),
			(q) => ({ ...q })
		);
		setEmailStatus(emailStatusFromQuery);

		const sizeSmallerFromQuery = map(
			filter(query, (v) => /^Smaller:/.test(v.label)),
			(q) => ({ ...q })
		);
		setSizeSmaller(sizeSmallerFromQuery);

		const sizeLargerFromQuery = map(
			filter(query, (v) => /^Larger:/.test(v.label)),
			(q) => ({ ...q })
		);
		setSizeLarger(sizeLargerFromQuery);
		const sentBeforeFromQuery = map(
			filter(query, (v) => /^before:/.test(v.label)),
			(q) => ({ ...q, hasAvatar: true, icon: 'CalendarOutline' })
		);
		setSentBefore(sentBeforeFromQuery);

		const sentAfterFromQuery = map(
			filter(query, (v) => /^after:/.test(v.label)),
			(q) => ({ ...q, hasAvatar: true, icon: 'CalendarOutline' })
		);
		setSentAfter(sentAfterFromQuery);

		const tagFromQuery = map(
			filter(query, (v) => /^tag:/.test(v.label)),
			(q) => ({ ...q, hasAvatar: true, icon: 'TagOutline' })
		);
		setTag(tagFromQuery);

		const sentOnFromQuery = map(
			filter(query, (v) => /^date:/.test(v.label)),
			(q) => ({ ...q, hasAvatar: true, icon: 'CalendarOutline' })
		);
		setSentOn(sentOnFromQuery);

		const folderFromQuery = map(
			filter(query, (v) => /^in:/.test(v.label)),
			(q) => ({
				...q,
				hasAvatar: true,
				icon: 'FolderOutline'
			})
		);

		setFolder(folderFromQuery);

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
		receivedFromAddress,
		sentAfter,
		sentBefore,
		sentFromAddress,
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
		setReceivedFromAddress([]);
		setSentFromAddress([]);
		setFolder([]);
		setTag([]);
	}, [updateQuery]);

	const queryToBe = useMemo(
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
				receivedFromAddress,
				sentFromAddress
			),
		[
			attachmentFilter,
			attachmentType,
			emailStatus,
			flaggedFilter,
			folder,
			otherKeywords,
			receivedFromAddress,
			sentAfter,
			sentBefore,
			sentFromAddress,
			sentOn,
			sizeLarger,
			sizeSmaller,
			subject,
			tag,
			unreadFilter
		]
	);

	const onConfirm = useCallback(() => {
		updateQuery(queryToBe);
		setIsSharedFolderIncluded(isSharedFolderIncludedTobe);
		onClose();
	}, [updateQuery, queryToBe, setIsSharedFolderIncluded, isSharedFolderIncludedTobe, onClose]);

	const subjectKeywordRowProps = useMemo(
		() => ({
			t,
			otherKeywords,
			setOtherKeywords,
			subject,
			setSubject
		}),
		[t, otherKeywords, subject]
	);

	const receivedSentAddressRowProps = useMemo(
		() => ({
			t,
			receivedFromAddress,
			setReceivedFromAddress,
			sentFromAddress,
			setSentFromAddress
		}),
		[t, receivedFromAddress, sentFromAddress]
	);

	const attachmentTypeEmailStatusRowProps = useMemo(
		() => ({
			t,
			attachmentType,
			setAttachmentType,
			emailStatus,
			setEmailStatus
		}),
		[t, attachmentType, setAttachmentType, emailStatus, setEmailStatus]
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
			t,
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
		() => ({ t, folder, setFolder, tagOptions, tag, setTag }),
		[t, folder, setFolder, tagOptions, tag, setTag]
	);

	const sendDateRowProps = useMemo(
		() => ({ sentBefore, setSentBefore, sentAfter, setSentAfter, sentOn, setSentOn, t }),
		[sentBefore, setSentBefore, sentAfter, setSentAfter, sentOn, setSentOn, t]
	);
	const toggleFiltersProps = useMemo(
		() => ({
			t,
			query,
			setUnreadFilter,
			setFlaggedFilter,
			setAttachmentFilter,
			setIsSharedFolderIncludedTobe,
			isSharedFolderIncludedTobe
		}),
		[t, query, isSharedFolderIncludedTobe]
	);

	const disabled = useDisabled({
		query,
		queryToBe,
		isSharedFolderIncluded,
		isSharedFolderIncludedTobe
	});

	return (
		<CustomModal open={open} onClose={onClose} maxHeight="90vh" size="medium">
			<Container padding={{ bottom: 'medium' }}>
				<ModalHeader
					onClose={onClose}
					title={t('label.single_advanced_filter', 'Advanced Filters')}
				/>

				<Container padding={{ horizontal: 'medium', vertical: 'small' }}>
					<ToggleFilters compProps={toggleFiltersProps} />
					<SubjectKeywordRow compProps={subjectKeywordRowProps} />
					<ReceivedSentAddressRow compProps={receivedSentAddressRowProps} />
					<AttachmentTypeEmailStatusRow compProps={attachmentTypeEmailStatusRowProps} />
					<SizeSmallerSizeLargerRow compProps={sizeSmallerSizeLargerRowProps} />
					<SendReceivedDateRow compProps={sendDateRowProps} />
					<TagFolderRow compProps={tagFolderRowProps} />
				</Container>
				<ModalFooter
					onConfirm={onConfirm}
					disabled={disabled}
					secondaryDisabled={secondaryDisabled}
					label={t('action.search', 'Search')}
					secondaryLabel={t('action.reset', 'Reset')}
					secondaryAction={resetFilters}
					secondaryBtnType="outlined"
					secondaryColor="primary"
					paddingTop="small"
				/>
			</Container>
		</CustomModal>
	);
};

export default AdvancedFilterModal;
