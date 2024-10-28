/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, ReactElement, useCallback } from 'react';

import { Container, ChipInput, ChipItem } from '@zextras/carbonio-design-system';
import { t } from '@zextras/carbonio-shell-ui';

import { isValidEmail } from './utils';
import type { SubjectKeywordRowProps } from '../../../types';

const SubjectKeywordRow: FC<SubjectKeywordRowProps> = ({ compProps }): ReactElement => {
	const { otherKeywords, setOtherKeywords, subject, setSubject } = compProps;
	const onChange = useCallback((state: ChipItem[], stateHandler: (state: ChipItem[]) => void) => {
		stateHandler(state);
	}, []);
	const keywordChipOnAdd = useCallback(
		(label: unknown) => ({
			label: label as string,
			hasAvatar: false,
			isGeneric: true
		}),
		[]
	);
	const chipOnAdd = useCallback(
		(
			label: string,
			preText: string,
			hasAvatar: boolean,
			isGeneric: boolean,
			isQueryFilter: boolean
		) => ({
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
		(label: unknown): any => chipOnAdd(label as string, 'Subject', false, false, true),
		[chipOnAdd]
	);

	const chipOnAdded = useCallback(
		(
			label: string,
			preText: string,
			hasAvatar: boolean,
			isGeneric: boolean,
			isQueryFilter: boolean,
			hasError: boolean,
			icon: string
		) => {
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

	const subjectPlaceholder = t('label.subject', 'Subject');

	return (
		<React.Fragment>
			<Container padding={{ bottom: 'small', top: 'medium' }} orientation="horizontal">
				<Container padding={{ right: 'extrasmall' }} maxWidth="50%">
					<ChipInput
						placeholder={t('label.keywords', 'Keywords')}
						data-testid={'keywords-input'}
						background="gray5"
						value={otherKeywords}
						separators={[
							{ key: 'Enter', ctrlKey: false },
							{ key: ',', ctrlKey: false }
						]}
						onChange={keywordOnChange}
						onAdd={keywordChipOnAdd}
					/>
				</Container>
				<Container padding={{ left: 'extrasmall' }} maxWidth="50%">
					<ChipInput
						placeholder={subjectPlaceholder}
						data-testid={'subject-input'}
						background="gray5"
						value={subject}
						separators={[
							{ key: 'Enter', ctrlKey: false },
							{ key: ',', ctrlKey: false }
						]}
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
