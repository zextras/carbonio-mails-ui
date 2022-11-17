import { FOLDERS } from "@zextras/carbonio-shell-ui";
import React from "react";

export const useHistory = jest.fn(() => ({
	location: {
		pathname: 'fakepath'
	},
	push: jest.fn()
}));

export const useParams = jest.fn(() => ({ folderId: FOLDERS.INBOX }));
export const Prompt = () => <></>