/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, ReactElement, useState, useCallback, useMemo, useEffect } from 'react';
import { CustomModal, Container, Icon, Row, Text, Padding } from '@zextras/carbonio-design-system';
import { TFunction } from 'i18next';
import { concat, filter, includes, map } from 'lodash';
import { getTags, ZIMBRA_STANDARD_COLORS } from '@zextras/carbonio-shell-ui';
import ModalFooter from '../sidebar/commons/modal-footer';
import { ModalHeader } from '../sidebar/commons/modal-header';
import ToggleFilters from './parts/toggle-filters';
import SubjectKeywordRow from './parts/subject-keyword-row';
import AttachmentTypeEmailStatusRow from './parts/attachment-type-email-status-row';
import SizeSmallerSizeLargerRow from './parts/size-smaller-size-larger-row';
import TagFolderRow from './parts/tag-folder-row';
import SendRecievedDateRow from './parts/send-date-row';
import RecievedSentAddressRow from './parts/recieved-sent-address-row';
import { useDisabled, useSecondaryDisabled } from './parts/use-disable-hooks';

type AdvancedFilterModalProps = {
	open: boolean;
	onClose: () => void;
	t: TFunction;
	query: Array<{
		label: string;
		value?: string;
		isGeneric?: boolean;
		isQueryFilter?: boolean;
	}>;
	updateQuery: (arg: any) => void;
};
type keywordState = Array<{
	label: string;
	hasAvatar?: boolean;
	value?: string;
	isQueryFilter?: boolean;
	isGeneric?: boolean;
	avatarIcon?: string;
	avatarBackground?: string;
	hasError?: boolean;
	error?: boolean;
}>;

const AdvancedFilterModal: FC<AdvancedFilterModalProps> = ({
	open,
	onClose,
	t,
	query,
	updateQuery
}): ReactElement => {
	const [otherKeywords, setOtherKeywords] = useState<keywordState>([]);
	const [attachmentFilter, setAttachmentFilter] = useState<keywordState>([]);
	const [unreadFilter, setUnreadFilter] = useState<keywordState>([]);
	const [flaggedFilter, setFlaggedFilter] = useState<keywordState>([]);

	const [receivedFromAddress, setReceivedFromAddress] = useState<keywordState>([]);
	const [sentFromAddress, setSentFromAddress] = useState<keywordState>([]);
	const [folder, setFolder] = useState<keywordState>([]);
	const [sentBefore, setSentBefore] = useState<keywordState>([]);
	const [sentOn, setSentOn] = useState<keywordState>([]);
	const [sentAfter, setSentAfter] = useState<keywordState>([]);
	const [subject, setSubject] = useState<keywordState>([]);
	const [attachmentType, setAttachmentType] = useState<keywordState>([]);
	const [emailStatus, setEmailStatus] = useState<keywordState>([]);
	const [sizeSmaller, setSizeSmaller] = useState<keywordState>([]);
	const [sizeLarger, setSizeLarger] = useState<keywordState>([]);
	const [sizeSmallerErrorLabel, setSizeSmallerErrorLabel] = useState('');
	const [sizeLargerErrorLabel, setSizeLargerErrorLabel] = useState('');

	const queryArray = useMemo(() => ['has:attachment', 'is:flagged', 'is:unread'], []);
	const tagOptions = useMemo(
		() =>
			map(getTags(), (item) => ({
				...item,
				label: item.name,
				customComponent: (
					<Row>
						<Icon icon="Tag" customColor={ZIMBRA_STANDARD_COLORS[(item.color ?? '0', 10)].hex} />
						<Padding left="small">
							<Text>{item.name}</Text>
						</Padding>
					</Row>
				)
			})),
		[]
	);
	const [tag, setTag] = useState<keywordState>([]);

	useEffect(() => {
		const updatedQuery = map(
			filter(
				query,
				(v) =>
					!includes(queryArray, v.label) &&
					!/^Subject:*/.test(v.label) &&
					!/^Attachment:*/.test(v.label) &&
					!/^Is:*/.test(v.label) &&
					!/^Smaller:*/.test(v.label) &&
					!/^Larger:*/.test(v.label) &&
					!/^subject:*/.test(v.label) &&
					!/^in:*/.test(v.label) &&
					!/^before:*/.test(v.label) &&
					!/^after:*/.test(v.label) &&
					!/^date:*/.test(v.label) &&
					!/^tag:*/.test(v.label) &&
					!v.isQueryFilter
			),
			(q) => ({ ...q, hasAvatar: false })
		);

		const subjectsFromQuery = map(
			filter(query, (v) => /^Subject:*/.test(v.label)),
			(q) => ({ ...q, hasAvatar: false })
		);
		setSubject(subjectsFromQuery);

		const attachmentTypeFromQuery = map(
			filter(query, (v) => /^Attachment:*/.test(v.label)),
			(q) => ({ ...q })
		);
		setAttachmentType(attachmentTypeFromQuery);

		const emailStatusFromQuery = map(
			filter(query, (v) => /^Is:*/.test(v.label)),
			(q) => ({ ...q })
		);
		setEmailStatus(emailStatusFromQuery);

		const sizeSmallerFromQuery = map(
			filter(query, (v) => /^Smaller:*/.test(v.label)),
			(q) => ({ ...q })
		);
		setSizeSmaller(sizeSmallerFromQuery);

		const sizeLargerFromQuery = map(
			filter(query, (v) => /^Larger:*/.test(v.label)),
			(q) => ({ ...q })
		);
		setSizeLarger(sizeLargerFromQuery);
		const sentBeforeFromQuery = map(
			filter(query, (v) => /^before:*/.test(v.label)),
			(q) => ({ ...q, hasAvatar: true, icon: 'CalendarOutline' })
		);
		setSentBefore(sentBeforeFromQuery);

		const sentAfterFromQuery = map(
			filter(query, (v) => /^after:*/.test(v.label)),
			(q) => ({ ...q, hasAvatar: true, icon: 'CalendarOutline' })
		);
		setSentAfter(sentAfterFromQuery);

		const tagFromQuery = map(
			filter(query, (v) => /^tag:*/.test(v.label)),
			(q) => ({ ...q, hasAvatar: true, icon: 'TagOutline' })
		);
		setTag(tagFromQuery);

		const sentOnFromQuery = map(
			filter(query, (v) => /^date:*/.test(v.label)),
			(q) => ({ ...q, hasAvatar: true, icon: 'CalendarOutline' })
		);
		setSentOn(sentOnFromQuery);

		const folderFromQuery = map(
			filter(query, (v) => /^in:*/.test(v.label)),
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
	const disabled = useDisabled({
		sizeSmaller,
		sizeLarger,
		totalKeywords,
		subject,
		unreadFilter,
		attachmentFilter,
		flaggedFilter,
		receivedFromAddress,
		sentFromAddress,
		emailStatus,
		folder,
		sentBefore,
		sentOn,
		sentAfter,
		tag,
		attachmentType
	});
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

	const onConfirm = useCallback(() => {
		const tmp = concat(
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
		);
		updateQuery(tmp);
		onClose();
	}, [
		receivedFromAddress,
		sentFromAddress,
		updateQuery,
		attachmentType,
		emailStatus,
		sizeSmaller,
		sizeLarger,
		folder,
		tag,
		sentBefore,
		subject,
		onClose,
		otherKeywords,
		unreadFilter,
		flaggedFilter,
		attachmentFilter,
		sentAfter,
		sentOn
	]);

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

	const recievedSentAddressRowProps = useMemo(
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
			setAttachmentFilter
		}),
		[t, query, setUnreadFilter, setFlaggedFilter, setAttachmentFilter]
	);

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
					<RecievedSentAddressRow compProps={recievedSentAddressRowProps} />
					<AttachmentTypeEmailStatusRow compProps={attachmentTypeEmailStatusRowProps} />
					<SizeSmallerSizeLargerRow compProps={sizeSmallerSizeLargerRowProps} />
					<SendRecievedDateRow compProps={sendDateRowProps} />
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
