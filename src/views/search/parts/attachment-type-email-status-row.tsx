/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, ReactElement, useCallback, useMemo, useState, useRef, useEffect } from 'react';
import { Container, ChipInput, ChipItem } from '@zextras/carbonio-design-system';
import { t } from '@zextras/carbonio-shell-ui';
import { filter, find } from 'lodash';
import { attachmentTypeItemsConstant, emailStatusItemsConstant } from '../../../constants';
import type { AttachTypeEmailStatusRowPropType, ChipOnAdd, ChipOnAddProps } from '../../../types';

const AttachmentTypeEmailStatusRow: FC<AttachTypeEmailStatusRowPropType> = ({
	compProps
}): ReactElement => {
	const { attachmentType, setAttachmentType, emailStatus, setEmailStatus } = compProps;
	const attachmentTypeItems = attachmentTypeItemsConstant(t);

	const emailStatusItems = emailStatusItemsConstant(t);

	const attachmentTypeRef: any = useRef();
	const emailStatusRef: any = useRef();
	const [attachmentTypeRefHasFocus, setAttachmentTypeRefHasFocus] = useState(false);
	const [emailStatusRefHasFocus, setEmailStatusRefHasFocus] = useState(false);

	const [attachmentTypeOptions, setAttachmentTypeOptions] = useState<any[]>(attachmentTypeItems);
	const [emailStatusOptions, setEmailStatusOptions] = useState<any[]>(emailStatusItems);
	const onChange = useCallback((state: ChipItem[], stateHandler: (state: ChipItem[]) => void) => {
		stateHandler(state);
	}, []);

	const chipOnAdd = useCallback(
		({ items, label, preText, hasAvatar, isGeneric, isQueryFilter }: ChipOnAddProps): ChipOnAdd => {
			const values: any = filter(items, (item: any) => item.label === label)[0];
			return {
				label: `${preText}:${label}`,
				hasAvatar,
				isGeneric,
				isQueryFilter,
				value: values.searchString,
				avatarIcon: values.icon,
				avatarColor: 'gray6'
			};
		},
		[]
	);

	const handlerAttachmentType = useCallback(() => {
		setAttachmentTypeRefHasFocus(!attachmentTypeRefHasFocus);
	}, [attachmentTypeRefHasFocus]);

	useEffect(() => {
		const ref: HTMLElement = attachmentTypeRef.current;

		if (ref) {
			ref.addEventListener('click', handlerAttachmentType);
		}
		return (): void => ref?.removeEventListener('click', handlerAttachmentType);
	}, [attachmentTypeRefHasFocus, handlerAttachmentType]);

	const handlerEmailStatus = useCallback(() => {
		setEmailStatusRefHasFocus(!emailStatusRefHasFocus);
	}, [emailStatusRefHasFocus]);

	useEffect(() => {
		const ref: HTMLElement = emailStatusRef.current;

		if (ref) {
			ref.addEventListener('click', handlerEmailStatus);
		}
		return (): void => ref?.removeEventListener('click', handlerEmailStatus);
	}, [emailStatusRefHasFocus, handlerEmailStatus]);

	const updateAttachmentTypeOptions = useCallback(
		(target: HTMLInputElement, q: Array<any>): void => {
			if (target.textContent && target.textContent.length > 0) {
				setAttachmentTypeOptions(
					attachmentTypeItems.filter(
						(v: any): boolean =>
							v.label?.toLowerCase().indexOf(target.textContent) !== -1 &&
							!find(q, (i) => i.value === v.label)
					)
				);
			} else {
				setAttachmentTypeOptions(attachmentTypeItems);
			}
		},
		[attachmentTypeItems]
	);

	const updateEmailStatusOptions = useCallback(
		(target: HTMLInputElement, q: Array<any>): void => {
			if (target.textContent && target.textContent.length > 0) {
				setEmailStatusOptions(
					emailStatusItems.filter(
						(v: any): boolean =>
							v.label?.toLowerCase().indexOf(target.textContent as string) !== -1 &&
							!find(q, (i) => i.value === v.label)
					)
				);
			} else {
				setEmailStatusOptions(emailStatusItems);
			}
		},
		[emailStatusItems]
	);

	const attachmentTypeOnInputType = useCallback(
		(
			ev: React.KeyboardEvent<HTMLInputElement> & {
				textContent: string | null;
			}
		) => {
			updateAttachmentTypeOptions(ev.target as HTMLInputElement, attachmentTypeItems);
		},
		[updateAttachmentTypeOptions, attachmentTypeItems]
	);
	const emailStatusOnInputType = useCallback(
		(
			ev: React.KeyboardEvent<HTMLInputElement> & {
				textContent: string | null;
			}
		) => {
			updateEmailStatusOptions(ev.target as HTMLInputElement, emailStatusItems);
		},
		[updateEmailStatusOptions, emailStatusItems]
	);

	const attachmentTypeChipOnAdd = useCallback(
		(label: unknown): ChipOnAdd =>
			chipOnAdd({
				items: attachmentTypeItems,
				label: label as string,
				preText: 'Attachment',
				hasAvatar: true,
				isGeneric: true,
				isQueryFilter: true
			}),
		[chipOnAdd, attachmentTypeItems]
	);

	const emailStatusChipOnAdd = useCallback(
		(label: unknown): ChipOnAdd =>
			chipOnAdd({
				items: emailStatusItems,
				label: label as string,
				preText: 'Is',
				hasAvatar: false,
				isGeneric: true,
				isQueryFilter: true
			}),
		[chipOnAdd, emailStatusItems]
	);

	const attachmentTypeOnChange = useCallback(
		(value: ChipItem[]): void => {
			setAttachmentTypeRefHasFocus(false);
			return onChange(value, setAttachmentType);
		},
		[onChange, setAttachmentType]
	);

	const emailStatusOnChange = useCallback(
		(value: ChipItem[]): void => onChange(value, setEmailStatus),
		[onChange, setEmailStatus]
	);

	const attachmentTypePlaceholder = useMemo(
		() => t('label.attachment_type', 'Attachment type'),
		[]
	);

	const emailStatusPlaceholder = useMemo(
		() => t('label.attachment_status', 'Status of e-mail item'),
		[]
	);
	const attachmentIcon = useMemo(
		() => (attachmentTypeRefHasFocus ? 'ChevronDown' : 'ChevronUp'),
		[attachmentTypeRefHasFocus]
	);

	const emailStatusIcon = useMemo(
		() => (emailStatusRefHasFocus ? 'ChevronDown' : 'ChevronUp'),
		[emailStatusRefHasFocus]
	);

	const attachmentTypeBottomBorderColor = useMemo(
		(): string => (attachmentTypeRefHasFocus ? 'primary' : 'transparent'),
		[attachmentTypeRefHasFocus]
	);
	const emailStatusBottomBorderColor = useMemo(
		(): string => (emailStatusRefHasFocus ? 'primary' : 'transparent'),
		[emailStatusRefHasFocus]
	);
	return (
		<>
			<Container padding={{ bottom: 'small', top: 'medium' }} orientation="horizontal">
				<Container padding={{ right: 'extrasmall' }} maxWidth="50%">
					<ChipInput
						ref={attachmentTypeRef}
						placeholder={attachmentTypePlaceholder}
						defaultValue={attachmentType}
						options={attachmentTypeOptions}
						background="gray5"
						disableOptions={false}
						onAdd={attachmentTypeChipOnAdd}
						onChange={attachmentTypeOnChange}
						maxChips={1}
						confirmChipOnBlur
						onInputType={attachmentTypeOnInputType}
						icon={attachmentIcon}
						bottomBorderColor={attachmentTypeBottomBorderColor}
					/>
				</Container>
				<Container padding={{ left: 'extrasmall' }} maxWidth="50%">
					<ChipInput
						dropdownMaxHeight="40%"
						confirmChipOnBlur
						ref={emailStatusRef}
						placeholder={emailStatusPlaceholder}
						defaultValue={emailStatus}
						options={emailStatusOptions}
						background="gray5"
						disableOptions={false}
						onAdd={emailStatusChipOnAdd}
						onChange={emailStatusOnChange}
						onInputType={emailStatusOnInputType}
						icon={emailStatusIcon}
						bottomBorderColor={emailStatusBottomBorderColor}
						maxHeight="40%"
					/>
				</Container>
			</Container>
		</>
	);
};

export default AttachmentTypeEmailStatusRow;
