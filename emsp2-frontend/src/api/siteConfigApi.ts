import axiosInstance from "./axiosConfig";
import type { SiteConfig, SiteConfigUpdatePayload } from "../types";

interface RawSiteConfig {
  site_name: string;
  slogan: string;
  logo_alt: string;
  logo_url: string;
  phone_1: string;
  phone_2: string;
  email_contact: string;
  email_info: string;
  address: string;
  show_homepage_banner: boolean;
  homepage_banner_text: string;
  about_text: string;
  facebook_url: string;
  twitter_url: string;
  linkedin_url: string;
  youtube_url: string;
  footer_text: string;
}

function mapSiteConfig(data: RawSiteConfig): SiteConfig {
  return {
    siteName: data.site_name,
    slogan: data.slogan,
    logoAlt: data.logo_alt,
    logoUrl: data.logo_url,
    phone1: data.phone_1,
    phone2: data.phone_2,
    emailContact: data.email_contact,
    emailInfo: data.email_info,
    address: data.address,
    showHomepageBanner: data.show_homepage_banner,
    homepageBannerText: data.homepage_banner_text,
    aboutText: data.about_text,
    facebookUrl: data.facebook_url,
    twitterUrl: data.twitter_url,
    linkedinUrl: data.linkedin_url,
    youtubeUrl: data.youtube_url,
    footerText: data.footer_text,
  };
}

function appendSiteField(formData: FormData, key: string, value: string | boolean | undefined) {
  if (value === undefined) {
    return;
  }
  formData.append(key, typeof value === "boolean" ? String(value) : value);
}

export async function fetchSiteConfig() {
  const response = await axiosInstance.get<RawSiteConfig>("/config/");
  return mapSiteConfig(response.data);
}

export async function updateSiteConfig(payload: SiteConfigUpdatePayload) {
  const formData = new FormData();

  appendSiteField(formData, "site_name", payload.siteName);
  appendSiteField(formData, "slogan", payload.slogan);
  appendSiteField(formData, "logo_alt", payload.logoAlt);
  appendSiteField(formData, "phone_1", payload.phone1);
  appendSiteField(formData, "phone_2", payload.phone2);
  appendSiteField(formData, "email_contact", payload.emailContact);
  appendSiteField(formData, "email_info", payload.emailInfo);
  appendSiteField(formData, "address", payload.address);
  appendSiteField(formData, "show_homepage_banner", payload.showHomepageBanner);
  appendSiteField(formData, "homepage_banner_text", payload.homepageBannerText);
  appendSiteField(formData, "about_text", payload.aboutText);
  appendSiteField(formData, "facebook_url", payload.facebookUrl);
  appendSiteField(formData, "twitter_url", payload.twitterUrl);
  appendSiteField(formData, "linkedin_url", payload.linkedinUrl);
  appendSiteField(formData, "youtube_url", payload.youtubeUrl);
  appendSiteField(formData, "footer_text", payload.footerText);
  appendSiteField(formData, "clear_logo", Boolean(payload.clearLogo));

  if (payload.logoFile) {
    formData.append("logo", payload.logoFile);
  }

  const response = await axiosInstance.patch<RawSiteConfig>("/config/admin/", formData);

  return mapSiteConfig(response.data);
}
