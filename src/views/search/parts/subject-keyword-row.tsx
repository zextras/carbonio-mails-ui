/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, ReactElement, useCallback, useMemo } from 'react';
import { Container, ChipInput } from '@zextras/carbonio-design-system';
import { TFunction } from 'i18next';
import { isValidEmail } from './utils';

type ComponentProps = {
	compProps: {
		t: TFunction;
		otherKeywords: Array<any>;
		setOtherKeywords: (arg: any) => void;
		subject: Array<any>;
		setSubject: (arg: any) => void;
	};
};
const SubjectKeywordRow: FC<ComponentProps> = ({ compProps }): ReactElement => {
	const { t, otherKeywords, setOtherKeywords, subject, setSubject } = compProps;
	const onChange = useCallback((state, stateHandler) => {
		stateHandler(state);
	}, []);
	const keywordChipOnAdd = useCallback(
		(label) => ({
			label,
			hasAvatar: false,
			isGeneric: true
		}),
		[]
	);
	const chipOnAdd = useCallback(
		(label, preText, hasAvatar, isGeneric, isQueryFilter) => ({
			label: `${preText}:${label}`,
			hasAvatar,
			isGeneric,
			isQueryFilter,
			value: `${preText}:${label}`
		}),
		[]
	);

	const subjectOnChange = useCallback(
		(label: string): void => onChange(label, setSubject),
		[onChange, setSubject]
	);

	const keywordOnChange = useCallback(
		(label: string): void => onChange(label, setOtherKeywords),
		[onChange, setOtherKeywords]
	);

	const subjectChipOnAdd = useCallback(
		(label: string): any => chipOnAdd(label, 'Subject', false, false, true),
		[chipOnAdd]
	);

	const chipOnAdded = useCallback(
		(label, preText, hasAvatar, isGeneric, isQueryFilter, hasError, icon) => {
			const chip = {
				label: `${preText}:${label}`,
				hasAvatar,
				isGeneric,
				isQueryFilter,
				value: `${preText}:${label}`,
				hasError,
				icon
			};
			if (!isValidEmail(label)) {
				chip.hasError = true;
			}
			chip.icon = 'EmailOutline';
			return chip;
		},
		[]
	);

	const recipChipOnAdd = useCallback(
		(label: string): any => chipOnAdded(label, 'from', false, false, true, false, 'EmailOutline'),
		[chipOnAdded]
	);

	const senderChipOnAdd = useCallback(
		(label: string): any => chipOnAdded(label, 'to', false, false, true, false, 'EmailOutline'),
		[chipOnAdded]
	);

	const subjectPlaceholder = useMemo(() => t('label.subject', 'Subject'), [t]);
	const chipBackground = useMemo(() => 'gray5', []);

	return (
		<React.Fragment>
			<Container padding={{ bottom: 'small', top: 'medium' }} orientation="horizontal">
				<Container padding={{ right: 'extrasmall' }} maxWidth="50%">
					<ChipInput
						placeholder={t('label.keywords', 'Keywords')}
						background={chipBackground}
						value={otherKeywords}
						confirmChipOnSpace={false}
						onChange={keywordOnChange}
						onAdd={keywordChipOnAdd}
					/>
				</Container>
				<Container padding={{ left: 'extrasmall' }} maxWidth="50%">
					<ChipInput
						placeholder={subjectPlaceholder}
						background={chipBackground}
						value={subject}
						confirmChipOnSpace={false}
						onChange={subjectOnChange}
						onAdd={subjectChipOnAdd}
						maxChips={1}
					/>
				</Container>
			</Container>
		</React.Fragment>
	);
};

export default SubjectKeywordRow;
