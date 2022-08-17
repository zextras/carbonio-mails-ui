/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, ReactElement, useCallback, useMemo } from 'react';
import { Container, ChipInput, ChipItem } from '@zextras/carbonio-design-system';

import { isValidEmail } from './utils';
import { SubjectKeywordRowProps } from '../../../types';

const SubjectKeywordRow: FC<SubjectKeywordRowProps> = ({ compProps }): ReactElement => {
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
		(value: ChipItem[]): void => onChange(value, setSubject),
		[onChange, setSubject]
	);

	const keywordOnChange = useCallback(
		(value: ChipItem[]): void => onChange(value, setOtherKeywords),
		[onChange, setOtherKeywords]
	);

	const subjectChipOnAdd = useCallback(
		(label: unknown): any => chipOnAdd(label, 'Subject', false, false, true),
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

	return (
		<React.Fragment>
			<Container padding={{ bottom: 'small', top: 'medium' }} orientation="horizontal">
				<Container padding={{ right: 'extrasmall' }} maxWidth="50%">
					<ChipInput
						placeholder={t('label.keywords', 'Keywords')}
						background="gray5"
						value={otherKeywords}
						confirmChipOnSpace={false}
						onChange={keywordOnChange}
						onAdd={keywordChipOnAdd}
					/>
				</Container>
				<Container padding={{ left: 'extrasmall' }} maxWidth="50%">
					<ChipInput
						placeholder={subjectPlaceholder}
						background="gray5"
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
