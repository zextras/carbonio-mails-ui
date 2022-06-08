/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, ReactElement, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { Controller } from 'react-hook-form';
import { Container, EmailComposerInput } from '@zextras/carbonio-design-system';
import * as StyledComp from './edit-view-styled-components';
import { EditViewContext } from './edit-view-context';

const SubjectRow: FC = () => {
	const [t] = useTranslation();
	const { control, editor, updateSubjectField, throttledSaveToDraft } = useContext(EditViewContext);

	return (
		<StyledComp.ColContainer occupyFull>
			<Controller
				name="subject"
				control={control}
				defaultValue={editor?.subject ?? ''}
				render={({ onChange, value }): ReactElement => (
					<Container background="gray5">
						<EmailComposerInput
							onChange={(ev: React.ChangeEvent<HTMLInputElement>): void => {
								updateSubjectField({ subject: ev.target.value });
								onChange(ev.target.value);
								throttledSaveToDraft({ subject: ev.target.value });
							}}
							placeholder={t('label.subject', 'Subject')}
							placeholderType="default"
							value={value}
						/>
					</Container>
				)}
			/>
		</StyledComp.ColContainer>
	);
};

export default SubjectRow;
