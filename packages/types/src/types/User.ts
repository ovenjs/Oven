import { UserId } from "../primitives/brand";

export interface User {
    userId:            UserId;
    name:              string;
    tag:               string;
    globalName?:       string;
    avatar?:           string;
    bot?:              boolean;
    system?:           boolean;
    MFAEnabled?:       boolean;
    banner?:           string;
    accentColor?:      number;
    locale?:           string;
    verified?:         boolean;
    flags?:            number;
    premiumType?:      number;
    publicFlags?:      number;
    avatarDecoration?: string;
}

export interface ClientUser extends User {
  verified:    boolean;
  flags:       number;
  premiumType: number;
  MFAEnabled:  boolean;
}