"use client";

import * as React from "react";
import {
  FaLocationDot,
  FaGlobe,
  FaBriefcase,
  FaDollarSign,
  FaClock,
  FaArrowUpRightFromSquare,
  FaBuilding,
  FaUsers,
  FaCalendarDays,
  FaLinkedin,
  FaTwitter,
  FaGithub,
  FaYoutube,
  FaFacebook,
  FaInstagram,
  FaChevronDown,
  FaChevronUp,
} from "react-icons/fa6";
import { JobDetail } from "@/lib/api/types";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Typography } from "@/components/ui/Typography";
import { formatAddedAgo } from "@/lib/formatAddedAgo";
import { cn, formatNumber } from "@/lib/utils";
import { CompanyLogo } from "@/components/jobs/CompanyLogo";

interface JobDetailViewProps {
  job: JobDetail;
}

export function JobDetailView({ job }: JobDetailViewProps) {
  const [isCompanyExpanded, setIsCompanyExpanded] = React.useState(false);
  const addedAgo = formatAddedAgo(job.published);

  const salaryDisplay = React.useMemo(() => {
    if (job.salary_text) return job.salary_text;
    if (job.salary_min) {
      const min = formatNumber(job.salary_min);
      const max = job.salary_max ? ` - ${formatNumber(job.salary_max)}` : "+";
      const currency = job.salary_currency || "$";
      return `${currency}${min}${max}`;
    }
    return null;
  }, [job.salary_text, job.salary_min, job.salary_max, job.salary_currency]);

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div className="flex flex-col md:flex-row md:items-start gap-4 md:gap-6">
          {/* Desktop Logo */}
          <div className="hidden md:block">
            <CompanyLogo
              src={job.company?.logo}
              className="h-16 w-16 rounded-xl bg-muted p-2"
              iconClassName="h-8 w-8"
            />
          </div>

          <div className="space-y-3 min-w-0">
            {/* Minimized Company Info on Mobile */}
            <div className="flex items-center gap-2 md:hidden">
              <CompanyLogo
                src={job.company?.logo}
                className="h-6 w-6 rounded-md bg-muted p-1"
                iconClassName="h-3.5 w-3.5"
              />
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                {job.company?.name}
              </span>
            </div>

            <Typography variant="h2" className="text-2xl md:text-3xl font-bold leading-tight">
              {job.title}
            </Typography>
            
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm md:text-base text-muted-foreground">
              <div className="hidden md:flex items-center gap-1.5">
                <FaBuilding className="h-4 w-4" />
                <span className="font-medium">{job.company?.name}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <FaLocationDot className="h-3.5 w-3.5 md:h-4 md:w-4" />
                <span>{job.location}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <FaClock className="h-3.5 w-3.5 md:h-4 md:w-4" />
                <span>{addedAgo}</span>
              </div>
            </div>
            {job.company?.website_url && (
              <div className="pt-0.5">
                <a
                  href={job.company.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs md:text-sm text-primary hover:underline flex items-center gap-1.5"
                >
                  <FaGlobe className="h-3 w-3 md:h-3.5 md:w-3.5" />
                  {new URL(job.company.website_url).hostname.replace("www.", "")}
                </a>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3 min-w-[160px]">
          {job.application_url && (
            <Button size="lg" className="w-full shadow-lg shadow-primary/20 py-6 md:py-2" asChild>
              <a
                href={job.application_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                Apply Now
                <FaArrowUpRightFromSquare className="ml-2 h-4 w-4" />
              </a>
            </Button>
          )}
        </div>
      </div>

      {/* Key Info Badges */}
      <div className="flex flex-wrap gap-3 p-4 rounded-xl bg-muted/30 border border-border/50">
        {job.has_remote && (
          <Badge variant="accent" className="h-8 px-3 text-sm gap-1.5">
            <FaGlobe className="h-3.5 w-3.5" />
            Remote
          </Badge>
        )}
        {job.experience_level && (
          <Badge variant="secondary" className="h-8 px-3 text-sm gap-1.5 capitalize">
            <FaBriefcase className="h-3.5 w-3.5" />
            {job.experience_level.toLowerCase()}
          </Badge>
        )}
        {job.employment_type && (
          <Badge variant="outline" className="h-8 px-3 text-sm gap-1.5 capitalize">
            <FaClock className="h-3.5 w-3.5" />
            {job.employment_type.replace("_", " ")}
          </Badge>
        )}
        {salaryDisplay && (
          <Badge variant="secondary" className="h-8 px-3 text-sm gap-1.5 bg-primary/5 text-primary border-primary/10">
            <FaDollarSign className="h-3.5 w-3.5" />
            {salaryDisplay}
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Description */}
        <div className="lg:col-span-2 space-y-6">
          {/* Mobile Collapsible Company Info */}
          {job.company && (
            <div className="lg:hidden border border-border rounded-xl overflow-hidden bg-card shadow-sm">
              <button
                onClick={() => setIsCompanyExpanded(!isCompanyExpanded)}
                className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    <FaBuilding className="h-4 w-4" />
                  </div>
                  <Typography variant="h4" className="text-sm font-bold">
                    About {job.company.name}
                  </Typography>
                </div>
                {isCompanyExpanded ? (
                  <FaChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <FaChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
              
              {isCompanyExpanded && (
                <div className="p-4 pt-0 border-t border-border/50 space-y-6 animate-in fade-in slide-in-from-top-2 duration-200">
                  {job.company.description && (
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {job.company.description}
                    </p>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    {job.company.industry && (
                      <div className="flex items-center gap-3 text-xs">
                        <FaBriefcase className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>{job.company.industry}</span>
                      </div>
                    )}
                    {job.company.employee_count && (
                      <div className="flex items-center gap-3 text-xs">
                        <FaUsers className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>{job.company.employee_count} employees</span>
                      </div>
                    )}
                    {job.company.headquarters && (
                      <div className="flex items-center gap-3 text-xs">
                        <FaLocationDot className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>{job.company.headquarters}</span>
                      </div>
                    )}
                    {job.company.founded && (
                      <div className="flex items-center gap-3 text-xs">
                        <FaCalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>Founded in {job.company.founded}</span>
                      </div>
                    )}
                  </div>

                  {/* Company Social Links */}
                  <div className="flex flex-wrap gap-2 pt-2">
                    {job.company.linkedin_url && (
                      <a
                        href={job.company.linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-md bg-muted hover:bg-muted/80 text-muted-foreground hover:text-[#0077B5] transition-colors"
                      >
                        <FaLinkedin className="h-3.5 w-3.5" />
                      </a>
                    )}
                    {job.company.twitter_url && (
                      <a
                        href={job.company.twitter_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-md bg-muted hover:bg-muted/80 text-muted-foreground hover:text-[#1DA1F2] transition-colors"
                      >
                        <FaTwitter className="h-3.5 w-3.5" />
                      </a>
                    )}
                    {job.company.website_url && (
                      <a
                        href={job.company.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-md bg-muted hover:bg-muted/80 text-muted-foreground hover:text-primary transition-colors"
                      >
                        <FaGlobe className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>

                  {/* Specialties */}
                  {job.company.specialties && job.company.specialties.length > 0 && (
                    <div className="pt-2 space-y-2">
                      <Typography variant="small" className="font-bold uppercase tracking-wider text-[10px] text-muted-foreground">
                        Specialties
                      </Typography>
                      <div className="flex flex-wrap gap-1.5">
                        {job.company.specialties.map((specialty, i) => (
                          <Badge key={i} variant="outline" className="text-[10px] py-0 px-2 font-normal">
                            {specialty}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Team Members */}
                  {job.company.team && job.company.team.length > 0 && (
                    <div className="pt-2 space-y-3">
                      <Typography variant="small" className="font-bold uppercase tracking-wider text-[10px] text-muted-foreground">
                        Team Members
                      </Typography>
                      <div className="flex flex-col gap-1">
                        {job.company.team.slice(0, 5).map((member, i) => {
                          const isLink = !!member.linkedin_url;
                          const Wrapper = isLink ? "a" : "div";
                          
                          return (
                            <Wrapper
                              key={i}
                              href={member.linkedin_url || undefined}
                              target={isLink ? "_blank" : undefined}
                              rel={isLink ? "noopener noreferrer" : undefined}
                              className={cn(
                                "flex items-center justify-between gap-3 group/member p-2 -mx-2 rounded-lg transition-colors",
                                isLink && "hover:bg-muted cursor-pointer"
                              )}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                {member.photo_url ? (
                                  <img
                                    src={member.photo_url}
                                    alt={member.name || ""}
                                    className="h-8 w-8 rounded-full object-cover"
                                  />
                                ) : (
                                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold">
                                    {member.name?.charAt(0)}
                                  </div>
                                )}
                                <div className="min-w-0">
                                  <p className="text-xs font-semibold truncate group-hover/member:text-primary transition-colors">
                                    {member.name}
                                  </p>
                                  <p className="text-[10px] text-muted-foreground truncate">
                                    {member.title}
                                  </p>
                                </div>
                              </div>
                              {isLink && (
                                <FaLinkedin className="h-3.5 w-3.5 text-muted-foreground group-hover/member:text-[#0077B5] transition-colors shrink-0" />
                              )}
                            </Wrapper>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <Typography variant="h3" className="text-xl font-bold">
            Job Description
          </Typography>
          <div
            className="job-description prose prose-sm max-w-none prose-neutral dark:prose-invert prose-headings:text-foreground prose-p:text-muted-foreground prose-li:text-muted-foreground prose-strong:text-foreground prose-a:text-primary"
            dangerouslySetInnerHTML={{ __html: job.description || "" }}
          />
        </div>

        {/* Sidebar / Company Info */}
        <div className="hidden lg:block space-y-8">
          {job.company && (
            <div className="space-y-6 p-6 rounded-2xl border border-border bg-card shadow-sm">
              <Typography variant="h4" className="font-bold">
                About the Company
              </Typography>
              
              <div className="space-y-4">
                {job.company.description && (
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {job.company.description}
                  </p>
                )}

                <div className="space-y-3 pt-2">
                  {job.company.industry && (
                    <div className="flex items-center gap-3 text-sm">
                      <FaBriefcase className="h-4 w-4 text-muted-foreground" />
                      <span>{job.company.industry}</span>
                    </div>
                  )}
                  {job.company.employee_count && (
                    <div className="flex items-center gap-3 text-sm">
                      <FaUsers className="h-4 w-4 text-muted-foreground" />
                      <span>{job.company.employee_count} employees</span>
                    </div>
                  )}
                  {job.company.headquarters && (
                    <div className="flex items-center gap-3 text-sm">
                      <FaLocationDot className="h-4 w-4 text-muted-foreground" />
                      <span>{job.company.headquarters}</span>
                    </div>
                  )}
                  {job.company.founded && (
                    <div className="flex items-center gap-3 text-sm">
                      <FaCalendarDays className="h-4 w-4 text-muted-foreground" />
                      <span>Founded in {job.company.founded}</span>
                    </div>
                  )}
                </div>

                {/* Company Social Links */}
                <div className="flex flex-wrap gap-2 pt-2">
                  {job.company.linkedin_url && (
                    <a
                      href={job.company.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-md bg-muted hover:bg-muted/80 text-muted-foreground hover:text-[#0077B5] transition-colors"
                      title="LinkedIn"
                    >
                      <FaLinkedin className="h-4 w-4" />
                    </a>
                  )}
                  {job.company.twitter_url && (
                    <a
                      href={job.company.twitter_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-md bg-muted hover:bg-muted/80 text-muted-foreground hover:text-[#1DA1F2] transition-colors"
                      title="Twitter"
                    >
                      <FaTwitter className="h-4 w-4" />
                    </a>
                  )}
                  {job.company.github_url && (
                    <a
                      href={job.company.github_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-md bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors"
                      title="GitHub"
                    >
                      <FaGithub className="h-4 w-4" />
                    </a>
                  )}
                  {job.company.youtube_url && (
                    <a
                      href={job.company.youtube_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-md bg-muted hover:bg-muted/80 text-muted-foreground hover:text-[#FF0000] transition-colors"
                      title="YouTube"
                    >
                      <FaYoutube className="h-4 w-4" />
                    </a>
                  )}
                  {job.company.facebook_url && (
                    <a
                      href={job.company.facebook_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-md bg-muted hover:bg-muted/80 text-muted-foreground hover:text-[#1877F2] transition-colors"
                      title="Facebook"
                    >
                      <FaFacebook className="h-4 w-4" />
                    </a>
                  )}
                  {job.company.instagram_url && (
                    <a
                      href={job.company.instagram_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-md bg-muted hover:bg-muted/80 text-muted-foreground hover:text-[#E4405F] transition-colors"
                      title="Instagram"
                    >
                      <FaInstagram className="h-4 w-4" />
                    </a>
                  )}
                  {job.company.website_url && (
                    <a
                      href={job.company.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-md bg-muted hover:bg-muted/80 text-muted-foreground hover:text-primary transition-colors"
                      title="Website"
                    >
                      <FaGlobe className="h-4 w-4" />
                    </a>
                  )}
                </div>

                {job.company.specialties && job.company.specialties.length > 0 && (
                  <div className="pt-4 space-y-3">
                    <Typography variant="small" className="font-bold uppercase tracking-wider text-[10px] text-muted-foreground">
                      Specialties
                    </Typography>
                    <div className="flex flex-wrap gap-1.5">
                      {job.company.specialties.map((specialty, i) => (
                        <Badge key={i} variant="outline" className="text-[10px] py-0 px-2 font-normal">
                          {specialty}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {job.company.team && job.company.team.length > 0 && (
                  <div className="pt-4 space-y-4">
                    <Typography variant="small" className="font-bold uppercase tracking-wider text-[10px] text-muted-foreground">
                      Team Members
                    </Typography>
                    <div className="flex flex-col gap-1">
                      {job.company.team.slice(0, 5).map((member, i) => {
                        const isLink = !!member.linkedin_url;
                        const Wrapper = isLink ? "a" : "div";
                        
                        return (
                          <Wrapper
                            key={i}
                            href={member.linkedin_url || undefined}
                            target={isLink ? "_blank" : undefined}
                            rel={isLink ? "noopener noreferrer" : undefined}
                            className={cn(
                              "flex items-center justify-between gap-3 group/member p-2 -mx-2 rounded-lg transition-colors",
                              isLink && "hover:bg-muted cursor-pointer"
                            )}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              {member.photo_url ? (
                                <img
                                  src={member.photo_url}
                                  alt={member.name || ""}
                                  className="h-8 w-8 rounded-full object-cover"
                                />
                              ) : (
                                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold">
                                  {member.name?.charAt(0)}
                                </div>
                              )}
                              <div className="min-w-0">
                                <p className="text-xs font-semibold truncate group-hover/member:text-primary transition-colors">
                                  {member.name}
                                </p>
                                <p className="text-[10px] text-muted-foreground truncate">
                                  {member.title}
                                </p>
                              </div>
                            </div>
                            {isLink && (
                              <FaLinkedin className="h-3.5 w-3.5 text-muted-foreground group-hover/member:text-[#0077B5] transition-colors shrink-0" />
                            )}
                          </Wrapper>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
