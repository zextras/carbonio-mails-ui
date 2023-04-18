/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { t, useIntegratedComponent } from '@zextras/carbonio-shell-ui';
import React, { FC, ReactElement, useCallback, useContext, useEffect, useState } from 'react';
import { Button, ChipInput, ChipItem, Container, Padding } from '@zextras/carbonio-design-system';
import { Controller, useForm } from 'react-hook-form';
import { map, some } from 'lodash';
import {
	ParticipantRole,
	ParticipantRoleType
} from '../../../../../carbonio-ui-commons/constants/participants';
import * as StyledComp from './edit-view-styled-components';
import { EditViewContext } from './edit-view-context';
import { EditViewContextType, MailsEditor } from '../../../../../types';

const emailRegex =
	// eslint-disable-next-line @typescript-eslint/no-unused-vars, max-len, no-control-regex
	/(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9]))\.){3}(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9])|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/;

interface ContactType extends ChipItem {
	type?: ParticipantRoleType;
	address?: string;
	name?: string;
	fullName?: string;
	email?: string | undefined;
	firstName?: string;
	label?: string | undefined;
	error?: boolean | string;
}

const ParticipantsRow: FC<{
	updateEditorCb: (data: Partial<MailsEditor>, editorId?: string) => void;
}> = ({ updateEditorCb }) => {
	const [ContactInput, isAvailable] = useIntegratedComponent('contact-input');
	const [showCc, setShowCc] = useState(false);
	const [showBcc, setShowBcc] = useState(false);
	const toggleCc = useCallback(() => setShowCc((show) => !show), []);
	const toggleBcc = useCallback(() => setShowBcc((show) => !show), []);
	const { control } = useForm();

	const { editor, throttledSaveToDraft } = useContext<EditViewContextType>(EditViewContext);

	useEffect(() => {
		if (editor?.cc?.length) {
			setShowCc(true);
		}
		if (editor?.bcc?.length) {
			setShowBcc(true);
		}
	}, [editor?.bcc?.length, editor?.cc?.length]);

	const result = (
		<>
			<StyledComp.ColContainer occupyFull>
				{isAvailable ? (
					<Controller
						name="to"
						control={control}
						defaultValue={editor.to ?? []}
						render={({ field: { onChange, value } }): ReactElement => (
							<Container
								orientation="horizontal"
								background="gray5"
								style={{ overflow: 'hidden' }}
								padding={{ all: 'none' }}
							>
								<Container background="gray5" style={{ overflow: 'hidden' }}>
									<ContactInput
										data-testid="RecipientTo"
										// eslint-disable-next-line @typescript-eslint/ban-ts-comment
										// @ts-ignore
										placeholder={t('label.to', 'To')}
										maxChips={999}
										onChange={(contacts: Array<ContactType>): void => {
											const data = map(contacts, (contact) =>
												contact.email
													? {
															...contact,
															type: ParticipantRole.TO,
															address: contact.email,
															name: contact.firstName,
															fullName: contact.fullName
													  }
													: { ...contact, type: ParticipantRole.TO }
											);
											updateEditorCb({ to: data });
											onChange(data);
											throttledSaveToDraft({ to: data });
										}}
										defaultValue={value}
										bottomBorderColor="transparent"
										hasError={some(editor?.to || [], { error: true })}
										errorLabel=""
									/>
								</Container>
								<Container
									width="fill"
									maxWidth="fit"
									background="gray5"
									padding={{ right: 'medium', left: 'extrasmall' }}
									orientation="horizontal"
								>
									<Padding right="small">
										<Button
											label={t('label.cc', 'Cc')}
											type="ghost"
											style={{ color: '#282828', padding: 0 }}
											onClick={toggleCc}
											data-testid="BtnCc"
										/>
									</Padding>
									<Button
										label={t('label.bcc', 'Bcc')}
										type="ghost"
										style={{ color: '#282828', padding: 0 }}
										onClick={toggleBcc}
									/>
								</Container>
							</Container>
						)}
					/>
				) : (
					<Controller
						name="to"
						control={control}
						defaultValue={editor.to ?? []}
						render={({ field: { onChange, value } }): ReactElement => (
							<Container orientation="horizontal" background="gray5">
								<Container background="gray5">
									<ChipInput
										data-testid="RecipientTo"
										placeholder={t('label.to', 'To')}
										maxChips={999}
										onChange={(contacts: Array<ContactType>): void => {
											const data = map(contacts, (contact) =>
												contact.email
													? {
															type: ParticipantRole.TO,
															address: contact.email,
															name: contact.firstName,
															fullName: contact.fullName,
															error: !emailRegex.test(contact.email)
													  }
													: {
															...contact,
															email: contact.label,
															address: contact.label,
															type: ParticipantRole.TO,
															error: !emailRegex.test(contact.label ?? '')
													  }
											);
											updateEditorCb({ to: data });
											onChange(data);
											throttledSaveToDraft({ to: data });
										}}
										defaultValue={map(value, (v) => ({ ...v, label: v.name }))}
										background="gray5"
										hasError={some(editor?.to || [], { error: true })}
										errorLabel=""
									/>
								</Container>
								<Container
									width="fit"
									background="gray5"
									padding={{ right: 'medium', left: 'extrasmall' }}
									orientation="horizontal"
								>
									<Button
										label={t('label.cc', 'Cc')}
										type="ghost"
										style={{ color: '#282828', padding: 0 }}
										onClick={toggleCc}
										data-testid="BtnCc"
									/>
									<Button
										label={t('label.bcc', 'Bcc')}
										type="ghost"
										style={{ color: '#282828', padding: 0 }}
										onClick={toggleBcc}
									/>
								</Container>
							</Container>
						)}
					/>
				)}
			</StyledComp.ColContainer>

			{showCc && (
				<StyledComp.ColContainer occupyFull>
					{isAvailable ? (
						<Controller
							name="cc"
							control={control}
							defaultValue={editor.cc ?? []}
							render={({ field: { onChange, value } }): ReactElement => (
								<ContactInput
									data-testid="RecipientCc"
									// eslint-disable-next-line @typescript-eslint/ban-ts-comment
									// @ts-ignore
									placeholder={t('label.cc', 'Cc')}
									maxChips={999}
									onChange={(contacts: Array<ContactType>): void => {
										const data = map(contacts, (contact) =>
											contact.email
												? {
														...contact,
														type: ParticipantRole.CARBON_COPY,
														address: contact.email,
														name: contact.firstName,
														fullName: contact.fullName
												  }
												: { ...contact, type: ParticipantRole.CARBON_COPY }
										);
										updateEditorCb({ cc: data });
										onChange(data);
										throttledSaveToDraft({ cc: data });
									}}
									defaultValue={value}
									errorLabel=""
									hasError={some(editor?.cc || [], { error: true })}
								/>
							)}
						/>
					) : (
						<Controller
							name="cc"
							control={control}
							defaultValue={editor.cc ?? []}
							render={({ field: { onChange, value } }): ReactElement => (
								<ChipInput
									data-testid="RecipientCc"
									placeholder={t('label.cc', 'Cc')}
									maxChips={999}
									onChange={(contacts: Array<ContactType>): void => {
										const data = map(contacts, (contact) =>
											contact.email
												? {
														...contact,
														type: ParticipantRole.CARBON_COPY,
														address: contact.email,
														name: contact.firstName,
														fullName: contact.fullName,
														error: !emailRegex.test(contact.email)
												  }
												: {
														...contact,
														email: contact.label,
														address: contact.label,
														type: ParticipantRole.CARBON_COPY,
														error: !emailRegex.test(contact.label ?? '')
												  }
										);
										updateEditorCb({ cc: data });
										onChange(data);
										throttledSaveToDraft({ cc: data });
									}}
									defaultValue={map(value, (v) => ({
										...v,
										label: v.name,
										type: ParticipantRole.CARBON_COPY
									}))}
									background="gray5"
									errorLabel=""
									hasError={some(editor?.cc || [], { error: true })}
								/>
							)}
						/>
					)}
				</StyledComp.ColContainer>
			)}
			{showBcc && (
				<StyledComp.ColContainer occupyFull>
					{isAvailable ? (
						<Controller
							name="bcc"
							control={control}
							defaultValue={editor.bcc ?? []}
							render={({ field: { onChange, value } }): ReactElement => (
								<ContactInput
									data-testid="RecipientBcc"
									// eslint-disable-next-line @typescript-eslint/ban-ts-comment
									// @ts-ignore
									placeholder={t('label.bcc', 'Bcc')}
									maxChips={999}
									onChange={(contacts: Array<ContactType>): void => {
										const data = map(contacts, (contact) =>
											contact.email
												? {
														...contact,
														type: ParticipantRole.BLIND_CARBON_COPY,
														address: contact.email,
														name: contact.firstName,
														fullName: contact.fullName
												  }
												: { ...contact, type: ParticipantRole.BLIND_CARBON_COPY }
										);
										updateEditorCb({ bcc: data });
										onChange(data);
										throttledSaveToDraft({ bcc: data });
									}}
									errorLabel=""
									hasError={some(editor?.bcc || [], { error: true })}
									defaultValue={value}
								/>
							)}
						/>
					) : (
						<Controller
							name="bcc"
							control={control}
							defaultValue={editor.bcc ?? []}
							render={({ field: { onChange, value } }): ReactElement => (
								<ChipInput
									data-testid="RecipientBcc"
									placeholder={t('label.bcc', 'Bcc')}
									maxChips={999}
									onChange={(contacts: Array<ContactType>): void => {
										const data = map(contacts, (contact) =>
											contact.email
												? {
														...contact,
														type: ParticipantRole.BLIND_CARBON_COPY,
														address: contact.email,
														name: contact.firstName,
														fullName: contact.fullName,
														error: !emailRegex.test(contact.email)
												  }
												: {
														...contact,
														email: contact.label,
														address: contact.label,
														type: ParticipantRole.BLIND_CARBON_COPY,
														error: !emailRegex.test(contact.label ?? '')
												  }
										);
										updateEditorCb({ bcc: data });
										onChange(data);
										throttledSaveToDraft({ bcc: data });
									}}
									background="gray5"
									defaultValue={map(value, (v) => ({ ...v, label: v.name }))}
									errorLabel=""
									hasError={some(editor?.bcc || [], { error: true })}
								/>
							)}
						/>
					)}
				</StyledComp.ColContainer>
			)}
		</>
	);
	return result;
};

export default ParticipantsRow;
