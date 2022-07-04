/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, ReactElement, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { Controller } from 'react-hook-form';
import {
	Container,
	EmailComposerInput,
	Padding,
	Tooltip,
	Icon,
	Checkbox
} from '@zextras/carbonio-design-system';
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
					<Container
						orientation="horizontal"
						background="gray5"
						style={{ overflow: 'hidden' }}
						padding={{ all: 'none' }}
					>
						<Container background="gray5" style={{ overflow: 'hidden' }}>
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
						<Container
							width="fit"
							background="gray5"
							padding={{ right: 'medium', left: 'extrasmall' }}
							orientation="horizontal"
						>
							{editor?.requestReadReceipt && (
								<Tooltip label={t('label.request_receipt', 'Request read receipt')}>
									<Padding right="small">
										<Checkbox
											value={editor?.requestReadReceipt}
											iconColor="secondary"
											onClick={(): null => null}
											style={{ cursor: 'default' }}
										/>
									</Padding>
								</Tooltip>
							)}
							{editor?.urgent && (
								<Tooltip label={t('tooltip.marked_as_important', 'Marked as important')}>
									<Padding right="small">
										<Icon icon="ArrowUpward" color="secondary" size="large" />
									</Padding>
								</Tooltip>
							)}
						</Container>
					</Container>
				)}
			/>
		</StyledComp.ColContainer>
	);
};

export default SubjectRow;
